import mongoose from "mongoose";
import ServiceRequest from "../models/ServiceRequest.js";
import Payment from "../models/Payment.js";
import { createWorkflowNotification } from "./notificationController.js";
import {
  emitToUser,
  emitToAdmins,
  emitToRequest,
} from "../socket.js";
import { findEligibleMechanicsForRequest } from "../utils/mechanicMatching.js";

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

    const matching = await findEligibleMechanicsForRequest(request);
    const mechanics = matching.eligible || [];

    if (mechanics.length === 0) {
      return res.status(200).json({
        success: true,
        requestId: request.id,
        requestReference: getRequestReference(request.id),
        mechanics: [],
        reason: matching.reason || request.noMechanicsReason || "no_mechanics_nearby",
        message: "No eligible mechanics are currently available in your area.",
      });
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      mechanics,
      reason: null,
    });
  } catch (error) {
    return handleError(res, "Get nearby mechanics error", error);
  }
};

export const getAssignment = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const matching = await findEligibleMechanicsForRequest(request);
    let assigned = null;

    if (request.mechanic) {
      assigned = matching.eligible?.[0] || {
        id: request.mechanic?._id?.toString() || request.mechanic?.toString(),
        name: request.mechanic?.fullName || "Assigned Technician",
        phone: request.mechanic?.mobile || null,
        specialty: null,
        rating: null,
        ratingCount: 0,
        completedJobs: null,
        distanceKm: null,
        location: null,
        isAssigned: true,
      };
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      mechanic: assigned,
      noMechanicsAvailable: !request.mechanic && Boolean(request.noMechanicsAvailable || matching.eligible.length === 0),
      matchingReason: request.mechanic ? null : (matching.reason || request.noMechanicsReason || null),
      inspectionFee: request.inspectionFee,
      inspectionPayment: request.inspectionPayment,
      status: request.status,
      quotation: {
        total: request.inspectionFee?.totalAmount || 0,
        labour: request.inspectionFee?.inspectionCharge || 0,
        travel: request.inspectionFee?.travelFee || 0,
        visit: request.inspectionFee?.visitFee || 0,
        quotationHoldSeconds: 300,
      },
      serviceRequest: request,
    });
  } catch (error) {
    return handleError(res, "Get assignment error", error);
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
    const inspPayPayload = {
      requestId: updated._id,
      status: updated.status,
      serviceRequest: updated,
      payment: paymentRecord,
    };
    const mechanicId = request.mechanic._id || request.mechanic;
    emitToUser(mechanicId, "inspection_payment_completed", inspPayPayload);
    emitToUser(mechanicId, "inspection_paid", inspPayPayload);
    emitToAdmins("inspection_payment_completed", inspPayPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "inspection_payment_completed", inspPayPayload);
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

    // Build mechanic info directly from populated request — no extra DB call needed
    const mechanicInfo = request.mechanic
      ? {
        id: request.mechanic._id?.toString(),
        name: request.mechanic.fullName || "Assigned Technician",
        phone: request.mechanic.mobile || null,
      }
      : null;

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: request.status,
      mechanic: mechanicInfo,
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
      mechanicLocation: request.mechanicLocation || null,
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
    const quotEvent =
      decision === "accepted"
        ? "repair_quotation_accepted"
        : "repair_quotation_rejected";
    const quotRespPayload = {
      requestId: updated._id,
      status: updated.status,
      decision,
      serviceRequest: updated,
    };
    const mechanicId = request.mechanic._id || request.mechanic;
    emitToUser(mechanicId, quotEvent, quotRespPayload);
    emitToAdmins(quotEvent, quotRespPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, quotEvent, quotRespPayload);
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
    const repPayPayload = {
      requestId: updated._id,
      status: updated.status,
      serviceRequest: updated,
      payment: paymentRecord,
    };
    emitToUser(
      request.mechanic._id || request.mechanic,
      "repair_payment_completed",
      repPayPayload
    );
    emitToAdmins("repair_payment_completed", repPayPayload);
    emitToAdmins("service_request_updated", updated);
    emitToRequest(request._id, "repair_payment_completed", repPayPayload);
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

    // Build mechanic info directly from populated request
    const mechanicInfo = request.mechanic
      ? {
        id: request.mechanic._id?.toString(),
        name: request.mechanic.fullName || "Assigned Technician",
        phone: request.mechanic.mobile || null,
      }
      : null;

    const completion = {
      status: request.status,
      completedAt:
        request.repairCompletedAt || request.completedAt || new Date().toISOString(),
      workCompleted: request.repairQuotation?.description || request.problem || "Vehicle repair completed",
      problemTitle: request.problem || "Roadside Assistance",
      mechanic: mechanicInfo,
      responseTimeMinutes: null,
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

    // Build mechanic info directly from populated request — no extra DB call
    const mechanicInfo = request.mechanic
      ? {
        id: request.mechanic._id?.toString(),
        name: request.mechanic.fullName || "Mechanic",
        phone: request.mechanic.mobile || null,
      }
      : null;

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

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      location: request.location,
      vehicle: request.vehicle,
      problem: request.problem,
      description: request.description,
      status: request.status,
      mechanic: mechanicInfo,
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
        workCompleted: request.repairQuotation?.description || request.problem || "Vehicle repair completed",
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
