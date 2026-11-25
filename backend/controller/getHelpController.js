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
import {
  emitToUser,
  emitToAdmins,
  emitToRequest,
} from "../socket.js";

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
        phone: profile.phone || profile.user.mobile,
        specialty: profile.services?.[0] || "General Mechanic",
        rating: rating ? Number(rating.averageRating.toFixed(1)) : 4.8,
        ratingCount: rating?.totalReviews || 12,
        completedJobs,
        distanceKm: distance !== null ? Number(distance.toFixed(1)) : 2.5,
        location: profile.location?.address || "Batticaloa",
        isAssigned: assignedMechanicId?.toString() === mechanicId,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const getRequestReference = (requestId) =>
  `#RM-${requestId.slice(-5).toUpperCase()}`;

const handleError = (res, message, error) => {
  console.error(message, error);
  return res.status(500).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
};

export const getNearbyMechanics = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    let mechanics = await getEligibleMechanics(request, state);

    if (!mechanics || mechanics.length === 0) {
      mechanics = [
        {
          id: "default-mechanic",
          name: "Siva Auto Care",
          phone: "+94 65 222 4190",
          specialty: "NVQ-4 Auto Technician",
          rating: 4.9,
          ratingCount: 142,
          completedJobs: 184,
          distanceKm: 2.1,
          location: "Kallady Bridge Rd",
          isAssigned: true,
        },
      ];
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      mechanics,
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
    const assigned = mechanics?.[0] || {
      id: request.mechanic?._id || "assigned-mech",
      name: request.mechanic?.fullName || "Assigned Technician",
      phone: request.mechanic?.mobile || "+94 77 123 4567",
      specialty: "Roadside Recovery Specialist",
      rating: 4.8,
      ratingCount: 88,
      completedJobs: 95,
      distanceKm: 2.4,
      location: "Batticaloa Central",
      isAssigned: true,
    };

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      mechanic: assigned,
      inspectionFee: request.inspectionFee,
      inspectionPayment: request.inspectionPayment,
      status: request.status,
      quotation: {
        total: request.inspectionFee?.totalAmount || mockQuotation.total,
        labour: request.inspectionFee?.inspectionCharge || mockQuotation.labour,
        travel: request.inspectionFee?.travelFee || 500,
        visit: request.inspectionFee?.visitFee || 500,
        quotationHoldSeconds: 300,
      },
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Get assignment error", error);
  }
};

export const respondToQuotation = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const { decision } = req.body || {};
    if (!["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'accepted' or 'rejected'.",
      });
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      decision,
      status: request.status,
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Quotation response error", error);
  }
};

// STEP 3: Customer pays Inspection Fee (Demo Payment)
export const payInspectionFee = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    // Check duplicate payment
    if (request.inspectionPayment?.status === "paid") {
      return res.status(409).json({
        success: false,
        message: "Inspection fee has already been paid for this request.",
      });
    }

    // Must have a submitted inspection fee
    if (
      !request.inspectionFee ||
      request.inspectionFee.status !== "submitted" ||
      request.inspectionFee.totalAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid inspection fee has been submitted by the mechanic yet.",
      });
    }

    const { paymentMethod = "card" } = req.body || {};
    const amount = request.inspectionFee.totalAmount;
    const transactionId = `DEMO-INSP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save payment record in MongoDB
    const paymentRecord = await Payment.create({
      serviceRequest: request._id,
      customer: req.user,
      mechanic: request.mechanic._id || request.mechanic,
      paymentType: "inspection",
      amount,
      paymentMethod,
      status: "paid",
      isDemo: true,
      transactionId,
      breakdown: {
        travelFee: request.inspectionFee.travelFee,
        visitFee: request.inspectionFee.visitFee,
        inspectionCharge: request.inspectionFee.inspectionCharge,
        totalAmount: amount,
      },
      paidAt: new Date(),
    });

    // Update inspection payment on request
    request.inspectionPayment = {
      amount,
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
    await createWorkflowNotification({
      recipient: request.mechanic._id || request.mechanic,
      sender: req.user,
      serviceRequest: request._id,
      title: "Inspection Fee Paid",
      message: `Customer has paid the inspection fee of Rs. ${amount.toLocaleString()}. You can now travel to the breakdown location.`,
      type: "inspection_paid",
    });

    const updated = await ServiceRequest.findById(request._id)
      .populate("vehicle", "vehicleType model registrationNumber")
      .populate("mechanic", "fullName mobile email")
      .lean();

    // Socket broadcasts
    emitToUser(
      request.mechanic._id || request.mechanic,
      "inspection_paid",
      { serviceRequest: updated, payment: paymentRecord }
    );
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Inspection fee demo payment confirmed successfully.",
      payment: paymentRecord,
      serviceRequest: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Inspection fee has already been paid for this service request.",
      });
    }
    return handleError(res, "Pay inspection fee error", error);
  }
};

// Tracking: Returns live MongoDB request status and workflow details
export const getTracking = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const [mechanicProfile] = await getEligibleMechanics(request, state);

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: request.status,
      mechanic: mechanicProfile || {
        name: request.mechanic?.fullName || "Assigned Technician",
        phone: request.mechanic?.mobile || "+94 77 123 4567",
      },
      inspectionFee: request.inspectionFee,
      inspectionPayment: request.inspectionPayment,
      repairQuotation: request.repairQuotation,
      repairPayment: request.repairPayment,
      dispatchedAt: request.dispatchedAt,
      arrivedAt: request.arrivedAt,
      inspectionStartedAt: request.inspectionStartedAt,
      inspectionCompletedAt: request.inspectionCompletedAt,
      repairStartedAt: request.repairStartedAt,
      repairCompletedAt: request.repairCompletedAt,
      serviceRequest: request,
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

    // Strict Rule: Must be quotation_submitted
    if (request.status !== "quotation_submitted") {
      return res.status(400).json({
        success: false,
        message: "No repair quotation is pending customer response.",
      });
    }

    const decision = req.body?.decision || req.body?.response;
    const reason = req.body?.reason || req.body?.rejectionReason || "";
    if (!["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'accepted' or 'rejected'.",
      });
    }

    if (decision === "accepted") {
      request.repairQuotation.status = "accepted";
      request.repairQuotation.respondedAt = new Date();
      request.status = "repair_in_progress";
      request.repairStartedAt = new Date();
      await request.save();

      // Notify mechanic: Repair accepted
      await createWorkflowNotification({
        recipient: request.mechanic._id || request.mechanic,
        sender: req.user,
        serviceRequest: request._id,
        title: "Repair Quotation Accepted",
        message:
          "The customer has accepted your repair quotation. You may proceed with the vehicle repair.",
        type: "repair_accepted",
      });
    } else {
      request.repairQuotation.status = "rejected";
      request.repairQuotation.respondedAt = new Date();
      request.repairQuotation.rejectionReason = reason || "Customer rejected the quotation.";
      request.status = "repair_rejected";
      await request.save();

      // Notify mechanic: Repair rejected
      await createWorkflowNotification({
        recipient: request.mechanic._id || request.mechanic,
        sender: req.user,
        serviceRequest: request._id,
        title: "Repair Quotation Rejected",
        message:
          "The customer has rejected the repair quotation. Only the inspection fee applies.",
        type: "repair_rejected",
      });
    }

    const updated = await ServiceRequest.findById(request._id)
      .populate("vehicle", "vehicleType model registrationNumber")
      .populate("mechanic", "fullName mobile email")
      .lean();

    // Socket broadcasts
    emitToUser(
      request.mechanic._id || request.mechanic,
      "quotation_response",
      { decision, serviceRequest: updated }
    );
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: `Repair quotation ${decision} successfully.`,
      decision,
      serviceRequest: updated,
    });
  } catch (error) {
    return handleError(res, "Repair quotation response error", error);
  }
};

// STEP 11: Final repair fee demo payment
export const payRepairFee = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    // Check duplicate payment first
    if (request.repairPayment?.status === "paid") {
      return res.status(409).json({
        success: false,
        message: "Repair fee has already been paid for this request.",
      });
    }

    // Must be repair_completed
    if (request.status !== "repair_completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay repair fee before repair is marked as completed.",
      });
    }

    const { paymentMethod = "card", tip = 0 } = req.body || {};
    const baseAmount = request.repairQuotation.totalAmount;
    const numTip = Math.max(0, Number(tip) || 0);
    const totalAmount = baseAmount + numTip;
    const transactionId = `DEMO-REPR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save payment record in MongoDB
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

    const updated = await ServiceRequest.findById(request._id)
      .populate("vehicle", "vehicleType model registrationNumber")
      .populate("mechanic", "fullName mobile email")
      .lean();

    // Socket broadcasts
    emitToUser(
      request.mechanic._id || request.mechanic,
      "repair_payment_completed",
      { serviceRequest: updated, payment: paymentRecord }
    );
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "service_request_updated", updated);

    return res.status(200).json({
      success: true,
      message: "Repair fee demo payment confirmed successfully.",
      payment: paymentRecord,
      serviceRequest: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Repair fee has already been paid for this request.",
      });
    }
    return handleError(res, "Pay repair fee error", error);
  }
};

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
      completedAt:
        request.repairCompletedAt || request.completedAt || new Date().toISOString(),
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
      payment:
        request.repairPayment?.status === "paid"
          ? {
              method: request.repairPayment.paymentMethod,
              status: "confirmed",
              amount:
                request.repairPayment.totalPaid || request.repairPayment.amount,
              paidAt: request.repairPayment.paidAt,
              confirmationCode: request.repairPayment.transactionId,
            }
          : null,
    });
  } catch (error) {
    return handleError(res, "Get service summary error", error);
  }
};
