import Vehicle from "../models/Vehicle.js";
import ServiceRequest from "../models/ServiceRequest.js";
import mongoose from "mongoose";
import { createWorkflowNotification } from "./notificationController.js";

// Helper to populate customer and vehicle details
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
        message: "This service request is no longer available.",
      });
    }

    return res.status(200).json({
      message: "Service request rejected. It remains active for other mechanics.",
      serviceRequest: rejectedRequest,
    });
  } catch (error) {
    console.error("Reject service request error:", error);
    return res.status(500).json({
      message: "Failed to reject service request.",
    });
  }
};

// 5. Create Service Request (Customer)
export const createServiceRequest = async (req, res) => {
  let createdVehicle;

  try {
    const { location, vehicle, problem, description } = req.body;

    if (!location?.address?.trim()) {
      return res.status(400).json({
        message: "Please provide your location.",
      });
    }

    const coordinates = location.coordinates;
    if (
      coordinates !== undefined &&
      (!Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -180 ||
        coordinates[0] > 180 ||
        coordinates[1] < -90 ||
        coordinates[1] > 90)
    ) {
      return res.status(400).json({
        message: "Please provide valid longitude and latitude coordinates.",
      });
    }

    const { vehicleType, model, registrationNumber } = vehicle || {};

    if (!vehicleType) {
      return res.status(400).json({
        message: "Please select your vehicle type.",
      });
    }

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        message: "Please select your vehicle problem.",
      });
    }

    const normalizedRegistrationNumber = registrationNumber?.trim().toUpperCase();
    let serviceVehicle;

    if (normalizedRegistrationNumber) {
      serviceVehicle = await Vehicle.findOne({
        user: req.user,
        registrationNumber: normalizedRegistrationNumber,
      });

      if (serviceVehicle) {
        serviceVehicle.vehicleType = vehicleType;
        if (model?.trim()) {
          serviceVehicle.model = model.trim();
        }
        await serviceVehicle.save();
      }
    }

    if (!serviceVehicle) {
      try {
        createdVehicle = await Vehicle.create({
          user: req.user,
          vehicleType,
          ...(model?.trim() && { model: model.trim() }),
          ...(normalizedRegistrationNumber && {
            registrationNumber: normalizedRegistrationNumber,
          }),
        });
        serviceVehicle = createdVehicle;
      } catch (error) {
        if (
          error.code === 11000 &&
          error.keyPattern?.registrationNumber &&
          normalizedRegistrationNumber
        ) {
          return res.status(409).json({
            message:
              "This registration number is already linked to another account. Check the number and try again.",
          });
        }
        throw error;
      }
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.user,
      vehicle: serviceVehicle._id,
      location: {
        address: location.address.trim(),
        landmark: location.landmark || "",
        details: location.details || "",
        ...(coordinates && { coordinates }),
      },
      problem: problem.trim(),
      description: description || "",
      status: "pending",
    });

    return res.status(201).json({
      message: "Service request created successfully.",
      serviceRequest,
    });
  } catch (error) {
    if (createdVehicle) {
      await Vehicle.findByIdAndDelete(createdVehicle._id);
    }

    console.error("Create Service Request Error:", error);
    return res.status(500).json({
      message: "Failed to create service request.",
      error: error.message,
    });
  }
};

// Helper to verify that a request is assigned to this mechanic
const findMechanicAssignedRequest = async (requestId, mechanicId, res) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({ success: false, message: "Invalid service request ID." });
    return null;
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    mechanic: mechanicId,
  });

  if (!request) {
    res.status(404).json({
      success: false,
      message: "Service request not found or not assigned to you.",
    });
    return null;
  }

  return request;
};

// 6. STEP 2: Mechanic sends inspection fee to customer
export const submitInspectionFee = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (!["accepted", "assigned", "inspection_fee_submitted"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit inspection fee in '${request.status}' status.`,
      });
    }

    if (request.inspectionPayment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Inspection fee has already been paid by the customer.",
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

    if (isNaN(numTravel) || numTravel < 0 || isNaN(numVisit) || numVisit < 0 || isNaN(numInspection) || numInspection < 0) {
      return res.status(400).json({
        success: false,
        message: "All inspection fee components must be non-negative numbers.",
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
      description: description || "Inspection, travel & location visit fee",
      status: "submitted",
      submittedAt: new Date(),
    };

    request.status = "inspection_fee_submitted";
    await request.save();

    // Notify customer that mechanic submitted inspection fee
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Inspection Fee Submitted",
      message: `Mechanic has submitted an inspection fee of Rs. ${totalAmount.toLocaleString()}. Please complete the demo payment to confirm dispatch.`,
      type: "system",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

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

// 7. STEP 5: Mechanic starts traveling to customer location (On The Way)
export const mechanicStartTravel = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic cannot visit before inspection fee payment
    if (request.inspectionPayment?.status !== "paid" || request.status !== "inspection_paid") {
      return res.status(403).json({
        success: false,
        message: "Cannot travel to customer before inspection fee payment is confirmed.",
      });
    }

    request.status = "on_the_way";
    request.dispatchedAt = new Date();
    await request.save();

    // Notify customer that mechanic is on the way
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Mechanic On The Way",
      message: "Your mechanic is on the way to your breakdown location.",
      type: "on_the_way",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Status updated to on the way.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic start travel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update travel status.",
    });
  }
};

// 8. STEP 5: Mechanic marks arrival at customer location
export const mechanicMarkArrived = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (request.status !== "on_the_way") {
      return res.status(400).json({
        success: false,
        message: "Status must be 'on_the_way' before marking arrival.",
      });
    }

    request.status = "arrived";
    request.arrivedAt = new Date();
    await request.save();

    // Notify customer that mechanic has arrived
    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Mechanic Arrived",
      message: "Mechanic has arrived at your breakdown location.",
      type: "arrived",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Status updated to arrived.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic mark arrived error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update arrival status.",
    });
  }
};

// 9. STEP 7: Mechanic starts inspection
export const mechanicStartInspection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (request.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: "Mechanic must arrive before starting inspection.",
      });
    }

    request.status = "inspecting";
    request.inspectionStartedAt = new Date();
    await request.save();

    await createWorkflowNotification({
      recipient: request.customer,
      sender: req.user,
      serviceRequest: request._id,
      title: "Inspection In Progress",
      message: "Mechanic has begun vehicle diagnosis and inspection.",
      type: "inspection_started",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Vehicle inspection started.",
      serviceRequest: updated,
    });
  } catch (error) {
    console.error("Mechanic start inspection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inspection status.",
    });
  }
};

// 10. STEP 7: Mechanic completes inspection
export const mechanicCompleteInspection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    if (!["arrived", "inspecting"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'arrived' or 'inspecting' before completing inspection.",
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
      message: "Vehicle inspection completed. Mechanic is preparing your repair quotation.",
      type: "inspection_completed",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

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

// 11. STEP 8: Mechanic submits repair quotation
export const submitRepairQuotation = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Repair quotation cannot be submitted before vehicle inspection is completed
    if (request.status !== "inspection_completed") {
      return res.status(400).json({
        success: false,
        message: "Vehicle inspection must be completed before submitting repair quotation.",
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

    if (isNaN(numLabour) || numLabour < 0 || isNaN(numParts) || numParts < 0 || isNaN(numAdditional) || numAdditional < 0) {
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
      description: description || "Roadside vehicle repair and parts replacement",
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

// 12. STEP 10: Mechanic completes the repair
export const mechanicCompleteRepair = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await findMechanicAssignedRequest(requestId, req.user, res);
    if (!request) return;

    // Strict Rule: Mechanic cannot complete repair before repair was accepted and in progress
    if (request.status !== "repair_in_progress") {
      return res.status(400).json({
        success: false,
        message: "Cannot mark repair as completed because repair is not currently in progress.",
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
      message: "Mechanic has completed your vehicle repair. Please proceed to the final repair settlement.",
      type: "repair_completed",
    });

    const updated = await populateServiceRequest(
      ServiceRequest.findById(request._id)
    ).lean();

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
