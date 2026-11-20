import mongoose from "mongoose";
import MechanicProfile from "../models/MechanicProfile.js";
import Review from "../models/Review.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Payment from "../models/Payment.js";
import {
  mockQuotation,
  mockTracking,
  mockWorkByProblem,
  mockWorkflowState,
} from "../data/getHelpMockData.js";
import { createWorkflowNotification } from "./notificationController.js";

const findOwnedRequest = async (req, res) => {
  const { requestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    res.status(400).json({
      success: false,
      message: "Invalid service request ID.",
    });
    return null;
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    customer: req.user,
  })
    .populate("vehicle", "vehicleType model registrationNumber")
    .populate("mechanic", "fullName mobile email");

  if (!request) {
    res.status(404).json({
      success: false,
      message: "Service request not found.",
    });
    return null;
  }

  return request;
};

const getWorkflowState = (requestId) => {
  if (!mockWorkflowState.has(requestId)) {
    mockWorkflowState.set(requestId, {
      quotationResponse: null,
      rejectedMechanicIds: [],
      currentSuggestedMechanicId: null,
      acceptedMechanicId: null,
      completion: null,
      payment: null,
    });
  }

  return mockWorkflowState.get(requestId);
};

const EARTH_RADIUS_KM = 6371;
const MECHANIC_AVERAGE_SPEED_KMH = 25;

const getCustomerCoordinates = (request) => {
  const coordinates = request.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;

  const [longitude, latitude] = coordinates;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
};

const calculateDistanceKm = (first, second) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))))
  );
};

const getEligibleMechanics = async (request, state) => {
  const customerCoordinates = getCustomerCoordinates(request);
  if (!customerCoordinates) return null;

  const assignedMechanicId = request.mechanic?._id || request.mechanic;
  const excludedMechanics = [
    ...(request.rejectedMechanics || []),
    ...state.rejectedMechanicIds,
  ];
  const profiles = await MechanicProfile.find(
    assignedMechanicId
      ? { user: assignedMechanicId, isVerified: true, verificationStatus: "approved" }
      : {
          isAvailable: true,
          isVerified: true,
          verificationStatus: "approved",
          user: { $nin: excludedMechanics },
        }
  )
    .populate("user", "fullName mobile email")
    .lean();

  const mechanicIds = profiles.map((profile) => profile.user?._id).filter(Boolean);
  const [ratingRows, completedRows] = await Promise.all([
    Review.aggregate([
      { $match: { mechanicId: { $in: mechanicIds } } },
      {
        $group: {
          _id: "$mechanicId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
    ServiceRequest.aggregate([
      {
        $match: {
          mechanic: { $in: mechanicIds },
          status: "completed",
        },
      },
      { $group: { _id: "$mechanic", total: { $sum: 1 } } },
    ]),
  ]);
  const ratingsByMechanic = new Map(
    ratingRows.map((row) => [row._id.toString(), row])
  );
  const completionsByMechanic = new Map(
    completedRows.map((row) => [row._id.toString(), row.total])
  );

  return profiles
    .map((profile) => {
      const mechanicId = profile.user._id.toString();
      const [longitude, latitude] = profile.location?.coordinates || [];
      const hasCoordinates =
        Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90;
      const distance = hasCoordinates
        ? calculateDistanceKm(customerCoordinates, { latitude, longitude })
        : null;
      const rating = ratingsByMechanic.get(mechanicId);
      const completedJobs = completionsByMechanic.get(mechanicId) || 0;

      return {
        id: mechanicId,
        name: profile.businessName || profile.user.fullName,
        owner: profile.user.fullName,
        phone: profile.user.mobile,
        email: profile.user.email,
        role: "Roadside Mechanic",
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null,
        rating: rating ? Number(rating.averageRating.toFixed(2)) : 0,
        reviews: rating?.totalReviews || 0,
        rescues: completedJobs,
        address: profile.location?.address || "",
        depot: profile.location?.address || "",
        unit: profile.businessName || "Roadside service unit",
        plate: "",
        verified: profile.isVerified && profile.verificationStatus === "approved",
        phoneVerified: Boolean(profile.user?.mobile),
        policeCleared: true,
        experienceYears: 5,
        equipment: "Hydraulic Jack, OBD2 Scanner, Jump Starter, Impact Wrench",
        specialties: profile.services || [],
        available: profile.isAvailable,
        distance,
      };
    })
    .sort(
      (first, second) =>
        (first.distance ?? Number.POSITIVE_INFINITY) -
        (second.distance ?? Number.POSITIVE_INFINITY)
    )
    .map(({ distance, ...mechanic }) => ({
      ...mechanic,
      distanceKm: distance === null ? null : Number(distance.toFixed(2)),
      etaMinutes:
        distance === null
          ? mockTracking.etaMinutes
          : Math.max(
              1,
              Math.ceil((distance / MECHANIC_AVERAGE_SPEED_KMH) * 60)
            ),
    }));
};

const getCurrentSuggestion = (mechanics, state) => {
  const currentMechanic = mechanics.find(
    (mechanic) => mechanic.id === state.currentSuggestedMechanicId
  );
  if (currentMechanic) return currentMechanic;

  state.currentSuggestedMechanicId = mechanics[0]?.id || null;
  return mechanics[0] || null;
};

const getRequestReference = (requestId) =>
  `RM-${requestId.slice(-6).toUpperCase()}`;

const handleError = (res, label, error) => {
  console.error(`${label}:`, error);
  return res.status(500).json({
    success: false,
    message: "Unable to process the Get Help request.",
  });
};

export const getNearbyMechanics = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const mechanics = await getEligibleMechanics(request, state);
    if (!mechanics) {
      return res.status(400).json({
        success: false,
        message: "The service request has no valid saved customer coordinates.",
      });
    }

    const suggestion = getCurrentSuggestion(mechanics, state);
    return res.status(200).json({
      success: true,
      mechanics,
      suggestedMechanicId: suggestion?.id || null,
      noMechanicsAvailable: mechanics.length === 0,
    });
  } catch (error) {
    return handleError(res, "Get nearby mechanics error", error);
  }
};

export const getAssignment = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const mechanics = await getEligibleMechanics(request, state);
    if (!mechanics) {
      return res.status(400).json({
        success: false,
        message: "The service request has no valid saved customer coordinates.",
      });
    }

    const assignedMechanicId =
      request.mechanic?._id?.toString() || request.mechanic?.toString();
    const mechanic = assignedMechanicId
      ? mechanics.find((item) => item.id === assignedMechanicId) || null
      : getCurrentSuggestion(mechanics, state);

    // If an inspection fee has been submitted by mechanic, use real inspection fee data
    const inspectionFee = request.inspectionFee || {
      travelFee: 500,
      visitFee: 500,
      inspectionCharge: 1000,
      totalAmount: 2000,
      description: "Mechanic travel, visit and on-site vehicle inspection charge",
      status: "pending",
    };

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: request.status,
      mechanic,
      inspectionFee,
      inspectionPayment: request.inspectionPayment,
      repairQuotation: request.repairQuotation,
      noMechanicsAvailable: !mechanic,
      quotation: {
        ...mockQuotation,
        mechanicId: mechanic?.id || null,
      },
    });
  } catch (error) {
    return handleError(res, "Get mechanic assignment error", error);
  }
};

export const respondToQuotation = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const { response, mechanicId } = req.body || {};
    if (!["accepted", "rejected"].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Mechanic response must be accepted or rejected.",
      });
    }
    if (
      typeof mechanicId !== "string" ||
      !mongoose.Types.ObjectId.isValid(mechanicId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid mechanic ID is required.",
      });
    }

    const state = getWorkflowState(request.id);
    const assignedMechanicId =
      request.mechanic?._id?.toString() || request.mechanic?.toString();
    if (assignedMechanicId) {
      if (response === "accepted" && assignedMechanicId === mechanicId) {
        const [assignedMechanic] = await getEligibleMechanics(request, state);
        return res.status(200).json({
          success: true,
          requestId: request.id,
          response,
          mechanic: assignedMechanic || null,
          message: "Mechanic accepted.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "A mechanic has already been accepted for this request.",
      });
    }

    if (!["pending", "searching"].includes(request.status)) {
      return res.status(409).json({
        message: "This service request can no longer be assigned.",
      });
    }

    const mechanics = await getEligibleMechanics(request, state);
    if (!mechanics) {
      return res.status(400).json({
        success: false,
        message: "The service request has no valid saved customer coordinates.",
      });
    }

    const currentMechanic = getCurrentSuggestion(mechanics, state);
    if (!currentMechanic || currentMechanic.id !== mechanicId) {
      return res.status(409).json({
        success: false,
        message: "This mechanic is no longer the current valid suggestion.",
      });
    }

    if (response === "accepted") {
      // Set assigned mechanic. Status becomes 'accepted'
      const assignedRequest = await ServiceRequest.findOneAndUpdate(
        {
          _id: request._id,
          customer: req.user,
          mechanic: null,
          status: { $in: ["pending", "searching"] },
        },
        {
          $set: {
            mechanic: currentMechanic.id,
            status: "accepted",
          },
        },
        { new: true, runValidators: true }
      );
      if (!assignedRequest) {
        return res.status(409).json({
          message: "This service request was assigned by another action.",
        });
      }

      request.mechanic = assignedRequest.mechanic;
      request.status = assignedRequest.status;
      state.acceptedMechanicId = currentMechanic.id;
      state.quotationResponse = "accepted";

      // Notify mechanic that customer has chosen them
      await createWorkflowNotification({
        recipient: currentMechanic.id,
        sender: req.user,
        serviceRequest: request._id,
        title: "New Job Assigned",
        message: "Customer selected you for roadside assistance. Please submit the inspection fee to begin dispatch.",
        type: "assigned",
      });

      return res.status(200).json({
        success: true,
        requestId: request.id,
        response,
        mechanic: currentMechanic,
        message: "Mechanic accepted.",
      });
    }

    await ServiceRequest.updateOne(
      { _id: request._id, customer: req.user, mechanic: null },
      { $addToSet: { rejectedMechanics: currentMechanic.id } }
    );
    request.rejectedMechanics.push(currentMechanic.id);
    state.rejectedMechanicIds.push(currentMechanic.id);
    state.quotationResponse = null;
    state.currentSuggestedMechanicId = null;
    const nextMechanics = await getEligibleMechanics(request, state);
    const nextMechanic = getCurrentSuggestion(nextMechanics, state);
    return res.status(200).json({
      success: true,
      requestId: request.id,
      response,
      nextMechanic,
      noMoreMechanics: !nextMechanic,
      message: nextMechanic
        ? "The next nearest mechanic is ready."
        : "No more mechanics available.",
    });
  } catch (error) {
    return handleError(res, "Save mechanic quotation response error", error);
  }
};

// STEP 3: Customer pays inspection fee (DEMO PAYMENT ONLY)
export const payInspectionFee = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    if (!request.mechanic) {
      return res.status(400).json({
        success: false,
        message: "A mechanic must be assigned before paying the inspection fee.",
      });
    }

    // Check status: must be submitted inspection fee
    if (
      !["inspection_fee_submitted", "accepted", "assigned"].includes(
        request.status
      ) &&
      request.inspectionPayment?.status !== "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot pay inspection fee in current status '${request.status}'.`,
      });
    }

    // Prevent duplicate payment
    if (request.inspectionPayment?.status === "paid") {
      return res.status(409).json({
        success: false,
        message: "Inspection fee has already been paid for this request.",
      });
    }

    const { paymentMethod = "card" } = req.body || {};

    // Get inspection fee amount
    let feeAmount = request.inspectionFee?.totalAmount;
    if (!feeAmount || feeAmount <= 0) {
      // Default standard fee if mechanic just accepted without custom breakdown
      feeAmount = 2000;
      request.inspectionFee = {
        travelFee: 500,
        visitFee: 500,
        inspectionCharge: 1000,
        totalAmount: 2000,
        description: "Standard travelling, location visit and vehicle inspection charge",
        status: "submitted",
        submittedAt: new Date(),
      };
    }

    const transactionId = `DEMO-INSP-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Save payment record in MongoDB
    const paymentRecord = await Payment.create({
      serviceRequest: request._id,
      customer: req.user,
      mechanic: request.mechanic._id || request.mechanic,
      paymentType: "inspection",
      amount: feeAmount,
      paymentMethod,
      status: "paid",
      isDemo: true,
      transactionId,
      breakdown: {
        travelFee: request.inspectionFee.travelFee,
        visitFee: request.inspectionFee.visitFee,
        inspectionCharge: request.inspectionFee.inspectionCharge,
        totalAmount: feeAmount,
      },
      paidAt: new Date(),
    });

    // Update inspection payment details on ServiceRequest
    request.inspectionPayment = {
      amount: feeAmount,
      paymentType: "demo",
      paymentMethod,
      status: "paid",
      transactionId,
      paidAt: new Date(),
    };
    request.inspectionFee.status = "paid";
    request.status = "inspection_paid";
    await request.save();

    // STEP 4: Notify Mechanic After Inspection Payment
    // Notification for the assigned mechanic:
    // Tells mechanic customer has paid inspection fee and can now visit
    await createWorkflowNotification({
      recipient: request.mechanic._id || request.mechanic,
      sender: req.user,
      serviceRequest: request._id,
      title: "Inspection Fee Paid",
      message: "Inspection fee paid – customer is ready for your visit. You may now start traveling.",
      type: "inspection_paid",
    });

    // Notification for the customer:
    await createWorkflowNotification({
      recipient: request.customer._id || request.customer,
      sender: request.mechanic._id || request.mechanic,
      serviceRequest: request._id,
      title: "Mechanic Notified",
      message: "Mechanic has been notified and will soon be on the way to your location.",
      type: "mechanic_notified",
    });

    return res.status(200).json({
      success: true,
      message: "Inspection fee demo payment successful. Mechanic has been notified.",
      payment: paymentRecord,
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Pay inspection fee error", error);
  }
};

// STEP 6: Real customer tracking status endpoint
export const getTracking = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    if (!request.mechanic) {
      return res.status(409).json({
        success: false,
        message: "A mechanic must be assigned before tracking.",
      });
    }

    const state = getWorkflowState(request.id);
    const [mechanicProfile] = await getEligibleMechanics(request, state);

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: request.status,
      mechanic: mechanicProfile || {
        id: request.mechanic._id || request.mechanic,
        name: request.mechanic.fullName || "Assigned Mechanic",
        owner: request.mechanic.fullName || "Mechanic",
        phone: request.mechanic.mobile || "",
        email: request.mechanic.email || "",
        role: "Roadside Mechanic",
        rating: 4.9,
        reviews: 24,
        rescues: 18,
        unit: "Roadside Service Unit",
        plate: "WP-CAB-4821",
        equipment: "Hydraulic Jack, OBD2 Scanner, Jump Starter",
      },
      inspectionFee: request.inspectionFee,
      inspectionPayment: request.inspectionPayment,
      dispatchedAt: request.dispatchedAt,
      arrivedAt: request.arrivedAt,
      inspectionStartedAt: request.inspectionStartedAt,
      inspectionCompletedAt: request.inspectionCompletedAt,
      repairQuotation: request.repairQuotation,
      repairStartedAt: request.repairStartedAt,
      repairCompletedAt: request.repairCompletedAt,
      repairPayment: request.repairPayment,
      completedAt: request.completedAt,
      expectedArrivalAt: request.dispatchedAt
        ? new Date(
            new Date(request.dispatchedAt).getTime() +
              mockTracking.etaMinutes * 60 * 1000
          ).toISOString()
        : new Date(Date.now() + mockTracking.etaMinutes * 60 * 1000).toISOString(),
      startingLocation: mockTracking.startingLocation,
      breakdownLocation: request.location,
      distanceRemainingKm: mockTracking.distanceRemainingKm,
      etaMinutes: mockTracking.etaMinutes,
      speedKmh: mockTracking.speedKmh,
      traffic: mockTracking.traffic,
      routeDescription: mockTracking.routeDescription,
      vanPosition: mockTracking.vanPosition,
      breakdownPosition: mockTracking.breakdownPosition,
      roadPath: mockTracking.roadPath,
    });
  } catch (error) {
    return handleError(res, "Get tracking error", error);
  }
};

// STEP 9: Customer accepts or rejects repair quotation
export const respondToRepairQuotation = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    if (request.status !== "quotation_submitted") {
      return res.status(400).json({
        success: false,
        message: "There is no pending repair quotation waiting for response.",
      });
    }

    const { response, rejectionReason = "" } = req.body || {};
    if (!["accepted", "rejected"].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Response must be 'accepted' or 'rejected'.",
      });
    }

    if (response === "accepted") {
      request.repairQuotation.status = "accepted";
      request.repairQuotation.respondedAt = new Date();
      request.status = "repair_in_progress";
      request.repairStartedAt = new Date();
      await request.save();

      // Notify mechanic: Customer accepted the repair quotation
      await createWorkflowNotification({
        recipient: request.mechanic._id || request.mechanic,
        sender: req.user,
        serviceRequest: request._id,
        title: "Repair Quotation Accepted",
        message: "Customer accepted the repair quotation. You can now begin repair work.",
        type: "repair_accepted",
      });

      // Notify customer: Repair work started
      await createWorkflowNotification({
        recipient: request.customer._id || request.customer,
        sender: request.mechanic._id || request.mechanic,
        serviceRequest: request._id,
        title: "Repair Work Started",
        message: "You accepted the repair quotation. Mechanic has begun vehicle repair work.",
        type: "repair_started",
      });

      return res.status(200).json({
        success: true,
        message: "Repair quotation accepted. Mechanic can start repair work.",
        serviceRequest: request,
      });
    }

    // Customer rejects repair quotation
    request.repairQuotation.status = "rejected";
    request.repairQuotation.respondedAt = new Date();
    request.repairQuotation.rejectionReason = rejectionReason || "Customer rejected repair quotation";
    request.status = "repair_rejected";
    request.repairPayment.status = "not_applicable";
    await request.save();

    // Notify mechanic: Customer rejected repair quotation
    await createWorkflowNotification({
      recipient: request.mechanic._id || request.mechanic,
      sender: req.user,
      serviceRequest: request._id,
      title: "Repair Quotation Rejected",
      message: "Customer rejected the repair quotation. Do not start repair work. Customer only pays inspection fee.",
      type: "repair_rejected",
    });

    // Notify customer
    await createWorkflowNotification({
      recipient: request.customer._id || request.customer,
      sender: request.mechanic._id || request.mechanic,
      serviceRequest: request._id,
      title: "Repair Rejected",
      message: "You rejected the repair quotation. No repair fee is payable. Only the initial inspection fee applies.",
      type: "repair_rejected",
    });

    return res.status(200).json({
      success: true,
      message: "Repair quotation rejected. No repair fee is payable.",
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Respond to repair quotation error", error);
  }
};

// STEP 11: Customer pays repair fee (DEMO PAYMENT ONLY)
export const payRepairFee = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    // Strict Rule: Prevent duplicate repair payments
    if (request.repairPayment?.status === "paid") {
      return res.status(409).json({
        success: false,
        message: "Repair fee has already been paid for this request.",
      });
    }

    // Strict Rule: Repair fee can only be paid after repair completion
    if (request.status !== "repair_completed") {
      return res.status(400).json({
        success: false,
        message: "Repair fee can only be paid after repair has been completed by mechanic.",
      });
    }

    // Strict Rule: Repair quotation must have been accepted
    if (request.repairQuotation?.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Repair quotation was not accepted. No repair fee is payable.",
      });
    }

    const { paymentMethod = "card", tip = 0 } = req.body || {};
    const numTip = Number(tip);
    if (isNaN(numTip) || numTip < 0) {
      return res.status(400).json({
        success: false,
        message: "Tip must be a non-negative number.",
      });
    }

    const baseAmount = request.repairQuotation.totalAmount;
    if (!baseAmount || baseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid repair quotation amount.",
      });
    }

    const totalAmount = baseAmount + numTip;
    const transactionId = `DEMO-REP-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Save separate repair payment record in MongoDB
    const paymentRecord = await Payment.create({
      serviceRequest: request._id,
      customer: req.user,
      mechanic: request.mechanic._id || request.mechanic,
      paymentType: "repair",
      amount: totalAmount,
      paymentMethod,
      status: "paid",
      isDemo: true,
      transactionId,
      breakdown: {
        labourCharge: request.repairQuotation.labourCharge,
        partsCharge: request.repairQuotation.partsCharge,
        additionalCharges: request.repairQuotation.additionalCharges,
        baseAmount,
        tip: numTip,
        totalAmount,
      },
      paidAt: new Date(),
    });

    // Update repairPayment on request
    request.repairPayment = {
      amount: baseAmount,
      tip: numTip,
      totalPaid: totalAmount,
      paymentType: "demo",
      paymentMethod,
      status: "paid",
      transactionId,
      paidAt: new Date(),
    };
    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    // Notify mechanic: Repair payment completed
    await createWorkflowNotification({
      recipient: request.mechanic._id || request.mechanic,
      sender: req.user,
      serviceRequest: request._id,
      title: "Repair Payment Completed",
      message: `Customer has completed the repair fee demo payment of Rs. ${totalAmount.toLocaleString()}.`,
      type: "repair_paid",
    });

    return res.status(200).json({
      success: true,
      message: "Repair fee demo payment confirmed successfully.",
      payment: paymentRecord,
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Pay repair fee error", error);
  }
};

// Existing completion & summary endpoints
export const getCompletion = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const [mechanicProfile] = await getEligibleMechanics(request, state);

    const problemWork =
      mockWorkByProblem[request.problem] || mockWorkByProblem.Other;

    const completion = {
      status: request.status,
      completedAt: request.repairCompletedAt || request.completedAt || new Date().toISOString(),
      workCompleted: request.repairQuotation?.description || problemWork.work,
      problemTitle: request.problem || problemWork.title,
      mechanic: mechanicProfile,
      responseTimeMinutes: mockTracking.etaMinutes,
    };

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      completion,
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Get completion error", error);
  }
};

export const submitPayment = async (req, res) => {
  // Alias to payRepairFee for backwards compatibility with any existing mock callers
  return payRepairFee(req, res);
};

export const getSummary = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const [mechanicProfile] = await getEligibleMechanics(request, state);

    // Fetch separate payment records from MongoDB
    const payments = await Payment.find({
      serviceRequest: request._id,
    }).lean();

    const inspectionPaymentRecord = payments.find(
      (p) => p.paymentType === "inspection"
    );
    const repairPaymentRecord = payments.find(
      (p) => p.paymentType === "repair"
    );

    const problemWork =
      mockWorkByProblem[request.problem] || mockWorkByProblem.Other;

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      location: request.location,
      vehicle: request.vehicle,
      problem: request.problem,
      description: request.description,
      status: request.status,
      mechanic: mechanicProfile || {
        name: request.mechanic?.fullName || "Mechanic",
      },
      inspectionFee: request.inspectionFee,
      inspectionPayment: request.inspectionPayment,
      inspectionPaymentRecord,
      repairQuotation: request.repairQuotation,
      repairPayment: request.repairPayment,
      repairPaymentRecord,
      quotation: {
        labour: request.repairQuotation?.labourCharge || 0,
        parts: request.repairQuotation?.partsCharge || 0,
        additionalCharges: request.repairQuotation?.additionalCharges || 0,
        total: request.repairQuotation?.totalAmount || 0,
        labourDescription: "Repair labour",
        partsDescription: "Replacement parts",
      },
      completion: {
        completedAt: request.repairCompletedAt || request.completedAt,
        workCompleted: request.repairQuotation?.description || problemWork.work,
        problemTitle: request.problem,
      },
      payment: request.repairPayment?.status === "paid"
        ? {
            method: request.repairPayment.paymentMethod,
            status: "confirmed",
            amount: request.repairPayment.totalPaid || request.repairPayment.amount,
            paidAt: request.repairPayment.paidAt,
            confirmationCode: request.repairPayment.transactionId,
          }
        : null,
    });
  } catch (error) {
    return handleError(res, "Get service summary error", error);
  }
};
