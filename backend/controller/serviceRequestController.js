import Vehicle from "../models/Vehicle.js";
import ServiceRequest from "../models/ServiceRequest.js";
import mongoose from "mongoose";
import { createWorkflowNotification } from "./notificationController.js";
import {
  emitToUser,
  emitToMechanics,
  emitToAdmins,
  emitToRequest,
} from "../socket.js";

// Helper to populate customer, vehicle, and mechanic details
const populateServiceRequest = (query) =>
  query
    .populate("customer", "fullName mobile email")
    .populate("vehicle", "vehicleType model registrationNumber")
    .populate("mechanic", "fullName mobile email");

// 1. Get pending requests available for mechanics
export const getPendingServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      status: "pending",
      mechanic: null,
      rejectedMechanics: { $ne: req.user },
    })
      .select("customer vehicle problem description location status createdAt")
      .populate("customer", "fullName mobile")
      .populate("vehicle", "vehicleType model registrationNumber")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ requests });
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

// 3. Mechanic accepts a pending request
export const acceptServiceRequest = async (req, res) => {
  try {
    const request = await getServiceRequestForAction(
      req.params.requestId,
      req.user,
      res
    );
    if (!request) return;

    const acceptedRequest = await populateServiceRequest(
      ServiceRequest.findOneAndUpdate(
        {
          _id: req.params.requestId,
          status: "pending",
          mechanic: null,
          rejectedMechanics: { $ne: req.user },
        },
        {
          $set: {
            status: "accepted",
            mechanic: req.user,
            acceptedAt: new Date(),
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
      message: `A mechanic has accepted your roadside assistance request.`,
      type: "assigned",
    });

    // Socket broadcasts
    emitToUser(
      acceptedRequest.customer._id || acceptedRequest.customer,
      "service_request_updated",
      acceptedRequest
    );
    emitToAdmins("service_request_updated", acceptedRequest);
    emitToRequest(acceptedRequest._id, "service_request_updated", acceptedRequest);

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
    const request = await getServiceRequestForAction(
      req.params.requestId,
      req.user,
      res
    );
    if (!request) return;

    const rejectedRequest = await populateServiceRequest(
      ServiceRequest.findOneAndUpdate(
        {
          _id: req.params.requestId,
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

    return res.status(200).json({
      message: "Service request rejected.",
      serviceRequest: rejectedRequest,
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
    emitToUser(request.customer, "inspection_fee_received", updated);
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
    emitToUser(request.customer, "mechanic_status_update", {
      status: "on_the_way",
      serviceRequest: updated,
    });
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
    emitToUser(request.customer, "mechanic_status_update", {
      status: "arrived",
      serviceRequest: updated,
    });
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
    emitToUser(request.customer, "mechanic_status_update", {
      status: "inspecting",
      serviceRequest: updated,
    });
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
    emitToUser(request.customer, "mechanic_status_update", {
      status: "inspection_completed",
      serviceRequest: updated,
    });
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
    emitToUser(request.customer, "quotation_received", updated);
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
    emitToUser(request.customer, "repair_completed", updated);
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

    // Save vehicle
    const vehicle = await Vehicle.create({
      user: req.user,
      vehicleType: vType.trim(),
      model: vModel.trim(),
      registrationNumber: vReg.trim(),
    });

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

    // Broadcast new service request to all mechanics and admins
    emitToMechanics("new_service_request", populatedRequest);
    emitToAdmins("new_service_request", populatedRequest);

    return res.status(201).json({
      success: true,
      message: "Service request created successfully",
      serviceRequest: populatedRequest,
    });
  } catch (error) {
    console.error("Create service request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create service request",
    });
  }
};
