import Vehicle from "../models/Vehicle.js";
import ServiceRequest from "../models/ServiceRequest.js";
import MechanicProfile from "../models/MechanicProfile.js";
import mongoose from "mongoose";
import { createWorkflowNotification } from "./notificationController.js";
import {
  emitToUser,
  emitToMechanics,
  emitToAdmins,
  emitToRequest,
} from "../socket.js";
import {
  ACTIVE_JOB_STATUSES,
  calculateDistanceKm,
  findEligibleMechanicsForRequest,
  getValidCoordinates,
  mapProblemToServices,
} from "../utils/mechanicMatching.js";

const NO_MECHANICS_MESSAGES = {
  all_rejected: "All eligible nearby mechanics have declined this request. You can retry searching.",
  no_matching_service: "No available mechanics nearby support this service type right now.",
  missing_mechanic_locations: "Nearby mechanics have not configured valid location coordinates.",
  missing_customer_location: "Your breakdown location coordinates are missing or invalid.",
  no_mechanics_nearby: "No available mechanics were found within service radius.",
};

// Helper to populate customer, vehicle, and mechanic details
const populateServiceRequest = (query) =>
  query
    .populate("customer", "fullName mobile email")
    .populate("vehicle", "vehicleType model registrationNumber")
    .populate("mechanic", "fullName mobile email");

// 1. Get pending requests available for the logged-in eligible mechanic
export const getPendingServiceRequests = async (req, res) => {
  try {
    const profile = await MechanicProfile.findOne({
      user: req.user,
      isVerified: true,
      verificationStatus: "approved",
    }).lean();

    if (!profile || !profile.isAvailable) {
      return res.status(200).json({ requests: [] });
    }

    const mechCoords = getValidCoordinates(profile.location?.coordinates);
    if (!mechCoords) {
      return res.status(200).json({ requests: [] });
    }

    // Do not show pending requests if mechanic already has an active job
    const hasActiveJob = await ServiceRequest.exists({
      mechanic: req.user,
      status: { $in: ACTIVE_JOB_STATUSES },
    });
    if (hasActiveJob) {
      return res.status(200).json({ requests: [] });
    }

    const requests = await ServiceRequest.find({
      status: "pending",
      mechanic: null,
      rejectedMechanics: { $ne: req.user },
    })
      .select("customer vehicle problem description location status createdAt retryCount")
      .populate("customer", "fullName mobile")
      .populate("vehicle", "vehicleType model registrationNumber")
      .sort({ createdAt: -1 })
      .lean();

    const radiusKm = Number(profile.serviceRadius) || 25;
    const eligibleRequests = [];

    for (const reqDoc of requests) {
      const requiredServices = mapProblemToServices(reqDoc.problem);
      const supportsService =
        requiredServices.length === 0 ||
        (Array.isArray(profile.services) &&
          profile.services.some((s) => requiredServices.includes(s)));
      if (!supportsService) continue;

      const customerCoords = getValidCoordinates(reqDoc.location?.coordinates);
      if (!customerCoords) continue;

      const distanceKm = calculateDistanceKm(customerCoords, mechCoords);
      if (distanceKm > radiusKm) continue;

      eligibleRequests.push({
        ...reqDoc,
        distanceKm: Number(distanceKm.toFixed(1)),
      });
    }

    return res.status(200).json({ requests: eligibleRequests });
  } catch (error) {
    console.error("Get pending service requests error:", error);
    return res.status(500).json({
      message: "Failed to fetch pending service requests.",
    });
  }
};

// 2. Get requests assigned to the logged-in mechanic
export const getAssignedServiceRequests = async (req, res) => {
  try {
    const requests = await populateServiceRequest(
      ServiceRequest.find({
        mechanic: req.user,
      }).sort({ updatedAt: -1 })
    ).lean();

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get assigned service requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned service requests.",
    });
  }
};

const getServiceRequestForAction = async (requestId, mechanicId, res) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({ message: "Invalid service request ID." });
    return null;
  }

  const request = await ServiceRequest.findById(requestId).select(
    "status mechanic rejectedMechanics"
  );

  if (!request) {
    res.status(404).json({ message: "Service request not found." });
    return null;
  }

  if (
    request.status !== "pending" ||
    request.mechanic ||
    request.rejectedMechanics?.some(
      (rejectedMechanic) => rejectedMechanic.toString() === mechanicId
    )
  ) {
    res.status(409).json({
      message: "This service request is no longer available to you.",
    });
    return null;
  }

  return request;
};

// 3. Mechanic accepts a pending request (atomic)
export const acceptServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getServiceRequestForAction(requestId, req.user, res);
    if (!request) return;

    // Prevent concurrent active jobs for the same mechanic
    const hasActiveJob = await ServiceRequest.exists({
      _id: { $ne: requestId },
      mechanic: req.user,
      status: { $in: ACTIVE_JOB_STATUSES },
    });
    if (hasActiveJob) {
      return res.status(409).json({
        message: "You already have an active service request in progress.",
      });
    }

    const acceptedRequest = await populateServiceRequest(
      ServiceRequest.findOneAndUpdate(
        {
          _id: requestId,
          status: "pending",
          mechanic: null,
          rejectedMechanics: { $ne: req.user },
        },
        {
          $set: {
            status: "accepted",
            mechanic: req.user,
            acceptedAt: new Date(),
            noMechanicsAvailable: false,
            noMechanicsReason: "",
          },
        },
        { new: true, runValidators: true }
      )
    );

    if (!acceptedRequest) {
      return res.status(409).json({
        message: "This service request is no longer available.",
      });
    }

    // Notify customer that mechanic accepted the request
    await createWorkflowNotification({
      recipient: acceptedRequest.customer._id || acceptedRequest.customer,
      sender: req.user,
      serviceRequest: acceptedRequest._id,
      title: "Mechanic Assigned",
      message: "A mechanic has accepted your roadside assistance request.",
      type: "assigned",
    });

    // Socket broadcasts to customer, admins, request room, and all mechanics (so others remove it)
    const customerId = acceptedRequest.customer._id || acceptedRequest.customer;
    emitToUser(customerId, "service_request_accepted", {
      requestId: acceptedRequest._id,
      status: acceptedRequest.status,
      serviceRequest: acceptedRequest,
    });
    emitToUser(customerId, "service_request_updated", acceptedRequest);
    emitToAdmins("service_request_accepted", {
      requestId: acceptedRequest._id,
      status: acceptedRequest.status,
      serviceRequest: acceptedRequest,
    });
    emitToAdmins("service_request_updated", acceptedRequest);
    emitToRequest(acceptedRequest._id, "service_request_accepted", {
      requestId: acceptedRequest._id,
      status: acceptedRequest.status,
      serviceRequest: acceptedRequest,
    });
    emitToRequest(acceptedRequest._id, "service_request_updated", acceptedRequest);
    emitToMechanics("service_request_accepted", {
      requestId: acceptedRequest._id,
      status: acceptedRequest.status,
      acceptedBy: req.user,
    });

    return res.status(200).json({
      message: "Service request accepted successfully.",
      serviceRequest: acceptedRequest,
    });
  } catch (error) {
    console.error("Accept service request error:", error);
    return res.status(500).json({
      message: "Failed to accept service request.",
    });
  }
};

// 4. Mechanic rejects a pending request
export const rejectServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getServiceRequestForAction(requestId, req.user, res);
    if (!request) return;

    const rejectedRequest = await populateServiceRequest(
      ServiceRequest.findOneAndUpdate(
        {
          _id: requestId,
          status: "pending",
          mechanic: null,
          rejectedMechanics: { $ne: req.user },
        },
        {
          $addToSet: {
            rejectedMechanics: req.user,
          },
        },
        { new: true, runValidators: true }
      )
    );

    if (!rejectedRequest) {
      return res.status(409).json({
        message: "This service request is no longer available to you.",
      });
    }

    // Recalculate remaining eligible mechanics
    const matching = await findEligibleMechanicsForRequest(rejectedRequest);
    const remainingCount = matching.eligible.length;

    emitToUser(req.user, "service_request_rejected", {
      requestId: rejectedRequest._id,
      status: rejectedRequest.status,
      mechanicId: req.user,
      remainingEligibleCount: remainingCount,
    });
    emitToAdmins("service_request_rejected", {
      requestId: rejectedRequest._id,
      status: rejectedRequest.status,
      mechanicId: req.user,
      remainingEligibleCount: remainingCount,
    });

    if (remainingCount === 0) {
      const reason = matching.reason || "all_rejected";
      const message = NO_MECHANICS_MESSAGES[reason] || NO_MECHANICS_MESSAGES.all_rejected;

      await ServiceRequest.findByIdAndUpdate(rejectedRequest._id, {
        $set: {
          noMechanicsAvailable: true,
          noMechanicsReason: reason,
        },
      });

      const customerId = rejectedRequest.customer?._id || rejectedRequest.customer;
      await createWorkflowNotification({
        recipient: customerId,
        sender: null,
        serviceRequest: rejectedRequest._id,
        title: "No Mechanics Available",
        message,
        type: "system",
      });

      const noMechanicsPayload = {
        requestId: rejectedRequest._id,
        status: rejectedRequest.status,
        noMechanicsAvailable: true,
        reason,
        message,
      };
      emitToUser(customerId, "no_mechanics_available", noMechanicsPayload);
      emitToRequest(rejectedRequest._id, "no_mechanics_available", noMechanicsPayload);
      emitToAdmins("no_mechanics_available", noMechanicsPayload);
    }

    return res.status(200).json({
      message: "Service request rejected.",
      serviceRequest: rejectedRequest,
      remainingEligibleCount: remainingCount,
      noMechanicsAvailable: remainingCount === 0,
      matchingReason: remainingCount === 0 ? matching.reason || "all_rejected" : null,
    });
  } catch (error) {
    console.error("Reject service request error:", error);
    return res.status(500).json({
      message: "Failed to reject service request.",
    });
  }
};

// Helper to find mechanic's assigned request
const findMechanicAssignedRequest = async (requestId, mechanicId, res) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({
      success: false,
      message: "Invalid service request ID.",
    });
    return null;
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    mechanic: mechanicId,
  });

  if (!request) {
    res.status(404).json({
      success: false,
      message: "Assigned service request not found.",
    });
    return null;
  }

  return request;
};

// 5. STEP 2: Mechanic submits Inspection Fee
export const submitInspectionFee = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (!["accepted", "inspection_fee_submitted"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Inspection fee can only be submitted after accepting the request and before payment.",
      });
    }

    const {
      travelFee = 0,
      visitFee = 0,
      inspectionCharge = 0,
      description = "",
    } = req.body || {};

    const numTravel = Number(travelFee);
    const numVisit = Number(visitFee);
    const numInspection = Number(inspectionCharge);

    if (
      isNaN(numTravel) ||
      numTravel < 0 ||
      isNaN(numVisit) ||
      numVisit < 0 ||
      isNaN(numInspection) ||
      numInspection < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Fee amounts must be valid non-negative numbers.",
      });
    }

    const totalAmount = numTravel + numVisit + numInspection;
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total inspection fee must be greater than zero.",
      });
    }

    request.inspectionFee = {
      travelFee: numTravel,
      visitFee: numVisit,
      inspectionCharge: numInspection,
      totalAmount,
      description:
        description ||
        "Roadside travel, location visit, and vehicle inspection fee",
      status: "submitted",
      submittedAt: new Date(),
    };

    request.status = "inspection_fee_submitted";
    await request.save();

    // Create notification for customer
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Inspection Fee Submitted",
      message: `Mechanic has submitted an inspection fee of Rs. ${totalAmount.toLocaleString()}. Please review and complete payment to initiate dispatch.`,
      type: "system",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Real-time socket emission
    const inspPayload = {
      requestId: updated._id,
      status: updated.status,
      inspectionFee: updated.inspectionFee,
      serviceRequest: updated,
    };
    emitToUser(request.customer, "inspection_fee_submitted", inspPayload);
    emitToAdmins("inspection_fee_submitted", inspPayload);
    emitToRequest(request._id, "inspection_fee_submitted", inspPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Inspection fee submitted successfully.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Submit inspection fee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit inspection fee.",
    });
  }
};

// 6. STEP 5: Mechanic starts travelling (status -> on_the_way)
export const mechanicStartTravel = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic cannot travel before inspection payment is confirmed
    if (request.status !== "inspection_paid") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot travel before customer confirms inspection fee payment.",
      });
    }

    request.status = "on_the_way";
    request.dispatchedAt = new Date();
    await request.save();

    // Notify customer: Mechanic is on the way
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Mechanic On The Way",
      message:
        "The mechanic has started travelling to your breakdown location.",
      type: "on_the_way",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const onWayPayload = {
      requestId: updated._id,
      status: "on_the_way",
      serviceRequest: updated,
    };
    emitToUser(request.customer, "mechanic_on_the_way", onWayPayload);
    emitToAdmins("mechanic_on_the_way", onWayPayload);
    emitToRequest(request._id, "mechanic_on_the_way", onWayPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Status updated to on the way.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic start travel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start travelling.",
    });
  }
};

// 6b. STEP 5b: Mechanic sends real-time GPS location update while on_the_way
export const updateMechanicLocation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (request.status !== "on_the_way") {
      return res.status(400).json({
        success: false,
        message: "GPS location tracking is only active while mechanic is on the way.",
      });
    }

    const { latitude, longitude, accuracy = null } = req.body || {};
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude coordinates are required.",
      });
    }

    const parsedAccuracy = accuracy !== null && Number.isFinite(Number(accuracy)) ? Number(accuracy) : null;
    const mechanicLocation = {
      coordinates: [lng, lat],
      accuracy: parsedAccuracy,
      updatedAt: new Date(),
    };

    request.mechanicLocation = mechanicLocation;
    await request.save();

    const locPayload = {
      requestId: request._id,
      status: request.status,
      mechanicLocation,
    };
    emitToUser(request.customer, "mechanic_location_updated", locPayload);
    emitToRequest(request._id, "mechanic_location_updated", locPayload);
    emitToAdmins("mechanic_location_updated", locPayload);

    return res.status(200).json({
      success: true,
      mechanicLocation,
    });
  } catch (error) {
    console.error("Update mechanic location error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update mechanic GPS location.",
    });
  }
};

// 7. STEP 6: Mechanic marks arrived
export const mechanicMarkArrived = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic can only arrive after traveling
    if (request.status !== "on_the_way") {
      return res.status(400).json({
        success: false,
        message: "Status must be on_the_way before marking as arrived.",
      });
    }

    request.status = "arrived";
    request.arrivedAt = new Date();
    await request.save();

    // Notify customer: Mechanic arrived
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Mechanic Arrived",
      message:
        "The mechanic has arrived at your breakdown location.",
      type: "arrived",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const arrivedPayload = {
      requestId: updated._id,
      status: "arrived",
      serviceRequest: updated,
    };
    emitToUser(request.customer, "mechanic_arrived", arrivedPayload);
    emitToAdmins("mechanic_arrived", arrivedPayload);
    emitToRequest(request._id, "mechanic_arrived", arrivedPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Status updated to arrived.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic mark arrived error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark arrived.",
    });
  }
};

// 8. STEP 7: Mechanic starts inspection
export const mechanicStartInspection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic can only start inspection after arrival
    if (request.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: "Mechanic must arrive before starting inspection.",
      });
    }

    request.status = "inspecting";
    request.inspectionStartedAt = new Date();
    await request.save();

    // Notify customer: Inspection started
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Vehicle Inspection Started",
      message:
        "Mechanic has started inspecting your vehicle at the breakdown location.",
      type: "inspection_started",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const inspStartPayload = {
      requestId: updated._id,
      status: "inspecting",
      serviceRequest: updated,
    };
    emitToUser(request.customer, "inspection_started", inspStartPayload);
    emitToAdmins("inspection_started", inspStartPayload);
    emitToRequest(request._id, "inspection_started", inspStartPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Vehicle inspection started.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic start inspection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start inspection.",
    });
  }
};

// 9. STEP 7b: Mechanic completes inspection
export const mechanicCompleteInspection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Must be inspecting
    if (request.status !== "inspecting") {
      return res.status(400).json({
        success: false,
        message: "Status must be inspecting to complete inspection.",
      });
    }

    request.status = "inspection_completed";
    request.inspectionCompletedAt = new Date();
    await request.save();

    // Notify customer: Vehicle inspection completed
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Vehicle Inspection Completed",
      message:
        "Vehicle inspection completed. Mechanic is preparing your repair quotation.",
      type: "inspection_completed",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const inspCompPayload = {
      requestId: updated._id,
      status: "inspection_completed",
      serviceRequest: updated,
    };
    emitToUser(request.customer, "inspection_completed", inspCompPayload);
    emitToAdmins("inspection_completed", inspCompPayload);
    emitToRequest(request._id, "inspection_completed", inspCompPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Vehicle inspection completed.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic complete inspection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete inspection.",
    });
  }
};

// 10. STEP 8: Mechanic submits repair quotation
export const submitRepairQuotation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Repair quotation cannot be submitted before vehicle inspection is completed
    if (request.status !== "inspection_completed") {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle inspection must be completed before submitting repair quotation.",
      });
    }

    const {
      labourCharge = 0,
      partsCharge = 0,
      additionalCharges = 0,
      description = "",
    } = req.body || {};

    const numLabour = Number(labourCharge);
    const numParts = Number(partsCharge);
    const numAdditional = Number(additionalCharges);

    if (
      isNaN(numLabour) ||
      numLabour < 0 ||
      isNaN(numParts) ||
      numParts < 0 ||
      isNaN(numAdditional) ||
      numAdditional < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All repair charge values must be non-negative numbers.",
      });
    }

    const totalAmount = numLabour + numParts + numAdditional;
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total repair fee must be greater than zero.",
      });
    }

    request.repairQuotation = {
      labourCharge: numLabour,
      partsCharge: numParts,
      additionalCharges: numAdditional,
      totalAmount,
      description:
        description || "Roadside vehicle repair and parts replacement",
      status: "submitted",
      submittedAt: new Date(),
    };

    request.status = "quotation_submitted";
    await request.save();

    // Notify customer: Repair quotation received
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Repair Quotation Received",
      message: `Mechanic submitted a repair quotation of Rs. ${totalAmount.toLocaleString()}. Please review and accept or reject.`,
      type: "repair_quotation_submitted",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const quotPayload = {
      requestId: updated._id,
      status: updated.status,
      repairQuotation: updated.repairQuotation,
      serviceRequest: updated,
    };
    emitToUser(request.customer, "repair_quotation_submitted", quotPayload);
    emitToAdmins("repair_quotation_submitted", quotPayload);
    emitToRequest(request._id, "repair_quotation_submitted", quotPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Repair quotation submitted successfully.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Submit repair quotation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit repair quotation.",
    });
  }
};

// 11. STEP 10: Mechanic completes the repair
export const mechanicCompleteRepair = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic cannot complete repair before repair was accepted and in progress
    if (request.status !== "repair_in_progress") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot mark repair as completed because repair is not currently in progress.",
      });
    }

    request.status = "repair_completed";
    request.repairCompletedAt = new Date();
    await request.save();

    // Notify customer: Repair completed
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Repair Completed",
      message:
        "Mechanic has completed your vehicle repair. Please proceed to the final repair settlement.",
      type: "repair_completed",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    // Socket broadcasts
    const repCompPayload = {
      requestId: updated._id,
      status: updated.status,
      serviceRequest: updated,
    };
    emitToUser(request.customer, "repair_completed", repCompPayload);
    emitToAdmins("repair_completed", repCompPayload);
    emitToRequest(request._id, "repair_completed", repCompPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Repair marked as completed successfully.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic complete repair error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete repair.",
    });
  }
};

// 12. Create a new service request (Customer)
export const createServiceRequest = async (req, res) => {
  try {
    const {
      vehicleType,
      model,
      registrationNumber,
      location,
      problem,
      description,
      vehicle: reqVehicle,
    } = req.body;

    const vType = vehicleType || reqVehicle?.vehicleType;
    const vModel = model || reqVehicle?.model;
    const vReg = registrationNumber || reqVehicle?.registrationNumber;

    // Validate inputs
    if (
      !vType?.trim() ||
      !vModel?.trim() ||
      !vReg?.trim() ||
      !location?.address?.trim() ||
      !problem?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Save vehicle (upsert — avoid duplicates for same user + registration)
    const vehicle = await Vehicle.findOneAndUpdate(
      { user: req.user, registrationNumber: vReg.trim() },
      {
        user: req.user,
        vehicleType: vType.trim(),
        model: vModel.trim(),
        registrationNumber: vReg.trim(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Save service request
    const newRequest = await ServiceRequest.create({
      customer: req.user,
      vehicle: vehicle._id,
      location: {
        address: location.address.trim(),
        landmark: location.landmark?.trim() || "",
        details: location.details?.trim() || "",
        coordinates: location.coordinates,
      },
      problem: problem.trim(),
      description: description?.trim() || "",
      status: "pending",
    });

    const populatedRequest = await populateServiceRequest(
      ServiceRequest.findById(newRequest._id)
    ).lean();

    // Find eligible nearby mechanics using coordinates, service type, availability, and radius
    const matching = await findEligibleMechanicsForRequest(populatedRequest);

    if (matching.eligible.length > 0) {
      // Deliver new request ONLY to eligible nearby mechanics
      for (const mech of matching.eligible) {
        emitToUser(mech.id, "new_service_request", {
          ...populatedRequest,
          distanceKm: mech.distanceKm,
        });
      }
    } else {
      const reason = matching.reason || "no_mechanics_nearby";
      const message = NO_MECHANICS_MESSAGES[reason] || NO_MECHANICS_MESSAGES.no_mechanics_nearby;

      await ServiceRequest.findByIdAndUpdate(newRequest._id, {
        $set: {
          noMechanicsAvailable: true,
          noMechanicsReason: reason,
        },
      });
      populatedRequest.noMechanicsAvailable = true;
      populatedRequest.noMechanicsReason = reason;

      await createWorkflowNotification({
        recipient: req.user,
        sender: null,
        serviceRequest: newRequest._id,
        title: "No Mechanics Available",
        message,
        type: "system",
      });

      emitToUser(req.user, "no_mechanics_available", {
        requestId: newRequest._id,
        status: populatedRequest.status,
        noMechanicsAvailable: true,
        reason,
        message,
      });
    }

    emitToAdmins("new_service_request", populatedRequest);

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      serviceRequest: populatedRequest,
      eligibleMechanicsCount: matching.eligible.length,
      matchingReason: matching.reason || null,
    });
  } catch (error) {
    console.error("Create service request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service request",
    });
  }
};

// 13. Safe retry search for an existing pending request (preserves rejectedMechanics & history)
export const retryServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service request ID.",
      });
    }

    const request = await populateServiceRequest(
      ServiceRequest.findOne({ _id: requestId, customer: req.user })
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    if (request.status !== "pending" || request.mechanic) {
      return res.status(409).json({
        success: false,
        message: "Only pending unassigned requests can be retried.",
      });
    }

    request.retryCount = (request.retryCount || 0) + 1;
    request.lastRetriedAt = new Date();

    const matching = await findEligibleMechanicsForRequest(request);

    if (matching.eligible.length > 0) {
      request.noMechanicsAvailable = false;
      request.noMechanicsReason = "";
      await request.save();

      const requestObj = request.toObject();
      for (const mech of matching.eligible) {
        emitToUser(mech.id, "new_service_request", {
          ...requestObj,
          distanceKm: mech.distanceKm,
        });
      }
      emitToAdmins("service_request_updated", requestObj);

      return res.status(200).json({
        success: true,
        message: `Found ${matching.eligible.length} eligible mechanic(s).`,
        serviceRequest: requestObj,
        eligibleMechanicsCount: matching.eligible.length,
        matchingReason: null,
      });
    }

    const reason = matching.reason || "no_mechanics_nearby";
    const message = NO_MECHANICS_MESSAGES[reason] || NO_MECHANICS_MESSAGES.no_mechanics_nearby;
    request.noMechanicsAvailable = true;
    request.noMechanicsReason = reason;
    await request.save();

    const noMechanicsPayload = {
      requestId: request._id,
      status: request.status,
      noMechanicsAvailable: true,
      reason,
      message,
    };
    emitToUser(req.user, "no_mechanics_available", noMechanicsPayload);

    return res.status(200).json({
      success: true,
      message,
      serviceRequest: request.toObject(),
      eligibleMechanicsCount: 0,
      matchingReason: reason,
    });
  } catch (error) {
    console.error("Retry service request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retry mechanic search.",
    });
  }
};
