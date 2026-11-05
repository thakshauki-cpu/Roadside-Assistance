import mongoose from "mongoose";
import MechanicProfile from "../models/MechanicProfile.js";
import Review from "../models/Review.js";
import ServiceRequest from "../models/ServiceRequest.js";
import {
  mockQuotation,
  mockTracking,
  mockWorkByProblem,
  mockWorkflowState,
} from "../data/getHelpMockData.js";

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
    .populate("mechanic", "fullName mobile");

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
    .populate("user", "fullName mobile")
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
        phoneVerified: false,
        policeCleared: false,
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

// Mechanic matching and service-request state are MongoDB-backed. Tracking and
// payment confirmation remain demo implementations.
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
    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: request.status,
      mechanic,
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

export const getTracking = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    if (!request.mechanic) {
      return res.status(409).json({
        success: false,
        message: "Accept the quotation before viewing tracking.",
      });
    }
    const [mechanic] = await getEligibleMechanics(request, state);

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: "on_the_way",
      mechanic: mechanic || null,
      dispatchedAt: new Date().toISOString(),
      expectedArrivalAt: new Date(
        Date.now() + mockTracking.etaMinutes * 60 * 1000
      ).toISOString(),
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
    return handleError(res, "Get mock tracking error", error);
  }
};

export const getCompletion = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    if (
      !request.mechanic ||
      !["accepted", "on_the_way", "in_progress", "completed"].includes(
        request.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Assign a mechanic before completing service.",
      });
    }

    const [mechanic] = await getEligibleMechanics(request, state);
    if (!mechanic) {
      return res.status(409).json({
        message: "The assigned mechanic profile could not be found.",
      });
    }

    if (request.status !== "completed" || !request.completedAt) {
      request.status = "completed";
      request.completedAt = request.completedAt || new Date();
      await request.save();
    }

    if (!state.completion) {
      const problemWork = mockWorkByProblem[request.problem] ||
        mockWorkByProblem.Other;
      state.completion = {
        status: "completed",
        completedAt: request.completedAt.toISOString(),
        workCompleted: problemWork.work,
        problemTitle: problemWork.title,
        mechanic,
        responseTimeMinutes: mockTracking.etaMinutes,
      };
    } else {
      state.completion.completedAt = request.completedAt.toISOString();
      state.completion.mechanic = mechanic;
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      completion: state.completion,
    });
  } catch (error) {
    return handleError(res, "Get mock service completion error", error);
  }
};

export const submitPayment = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    if (request.status !== "completed" || !request.mechanic || !state.completion) {
      return res.status(409).json({
        success: false,
        message: "Complete the service before submitting payment.",
      });
    }

    const {
      paymentMethod,
      tip = 0,
    } = req.body || {};

    if (!["cash", "card", "qr"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Choose a supported payment method.",
      });
    }

    if (!Number.isFinite(tip) || tip < 0) {
      return res.status(400).json({
        success: false,
        message: "Tip must be a non-negative number.",
      });
    }

    const total = mockQuotation.total + tip;
    if (state.payment) {
      return res.status(409).json({
        success: false,
        message: "Payment has already been submitted for this request.",
      });
    }

    state.payment = {
      method: paymentMethod,
      status: "confirmed",
      baseAmount: mockQuotation.total,
      tip,
      amount: total,
      confirmationCode: `MOCK-${request.id.slice(-6).toUpperCase()}`,
      paidAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      requestId: request.id,
      payment: state.payment,
    });
  } catch (error) {
    return handleError(res, "Submit mock payment error", error);
  }
};

export const getSummary = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    if (!state.payment || !state.completion) {
      return res.status(409).json({
        success: false,
        message: "Submit payment before requesting the final summary.",
      });
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      location: request.location,
      vehicle: request.vehicle,
      problem: request.problem,
      description: request.description,
      mechanic: state.completion.mechanic,
      quotation: mockQuotation,
      completion: state.completion,
      payment: state.payment,
    });
  } catch (error) {
    return handleError(res, "Get mock service summary error", error);
  }
};
