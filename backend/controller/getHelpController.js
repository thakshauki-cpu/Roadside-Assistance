import mongoose from "mongoose";
import ServiceRequest from "../models/ServiceRequest.js";
import {
  mockMechanics,
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
  }).populate("vehicle", "vehicleType model registrationNumber");

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

const getEligibleMechanics = (request, state) => {
  const customerCoordinates = getCustomerCoordinates(request);
  if (!customerCoordinates) return null;

  return mockMechanics
    .filter(
      (mechanic) =>
        mechanic.available &&
        !state.rejectedMechanicIds.includes(mechanic.id)
    )
    .map((mechanic) => {
      const distance = calculateDistanceKm(customerCoordinates, {
        latitude: mechanic.latitude,
        longitude: mechanic.longitude,
      });

      return {
        mechanic,
        distance,
      };
    })
    .sort((first, second) => first.distance - second.distance)
    .map(({ mechanic, distance }) => ({
      ...mechanic,
      distanceKm: Number(distance.toFixed(2)),
      etaMinutes: Math.max(
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

const getAssignedMechanic = (mechanicId) =>
  mockMechanics.find((mechanic) => mechanic.id === mechanicId) || null;

const getRequestReference = (requestId) =>
  `RM-${requestId.slice(-6).toUpperCase()}`;

const handleError = (res, label, error) => {
  console.error(`${label}:`, error);
  return res.status(500).json({
    success: false,
    message: "Unable to process the Get Help request.",
  });
};

//this is giving mock data for the nearby mechanics, assignment, tracking, completion, payment, and summary of the service request. It is not connected to the database or any real-time data.
export const getNearbyMechanics = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const mechanics = getEligibleMechanics(request, state);
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
    return handleError(res, "Get nearby mock mechanics error", error);
  }
};
//It provides the mock mechanic, quotation, reference, and quotation status assigned to that reques
export const getAssignment = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    const mechanics = getEligibleMechanics(request, state);
    if (!mechanics) {
      return res.status(400).json({
        success: false,
        message: "The service request has no valid saved customer coordinates.",
      });
    }

    const mechanic = state.acceptedMechanicId
      ? mechanics.find((item) => item.id === state.acceptedMechanicId) ||
        getAssignedMechanic(state.acceptedMechanicId)
      : getCurrentSuggestion(mechanics, state);
    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: state.quotationResponse || "pending",
      mechanic,
      noMechanicsAvailable: !mechanic,
      quotation: {
        ...mockQuotation,
        mechanicId: mechanic?.id || null,
      },
    });
  } catch (error) {
    return handleError(res, "Get mock assignment error", error);
  }
};

//when customer accepts or reject 
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
    if (typeof mechanicId !== "string" || !mechanicId) {
      return res.status(400).json({
        success: false,
        message: "A mechanic ID is required.",
      });
    }

    const state = getWorkflowState(request.id);
    if (state.acceptedMechanicId) {
      if (response === "accepted" && state.acceptedMechanicId === mechanicId) {
        return res.status(200).json({
          success: true,
          requestId: request.id,
          response,
          mechanic: getAssignedMechanic(state.acceptedMechanicId),
          message: "Mechanic accepted.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "A mechanic has already been accepted for this request.",
      });
    }

    const mechanics = getEligibleMechanics(request, state);
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

    state.rejectedMechanicIds.push(currentMechanic.id);
    state.quotationResponse = null;
    state.currentSuggestedMechanicId = null;
    const nextMechanics = getEligibleMechanics(request, state);
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
    return handleError(res, "Save mock quotation response error", error);
  }
};

//when quatation is accepted after that customer can track the mechanic and the service request
export const getTracking = async (req, res) => {
  try {
    const request = await findOwnedRequest(req, res);
    if (!request) return;

    const state = getWorkflowState(request.id);
    if (state.quotationResponse !== "accepted") {
      return res.status(409).json({
        success: false,
        message: "Accept the quotation before viewing tracking.",
      });
    }

    return res.status(200).json({
      success: true,
      requestId: request.id,
      requestReference: getRequestReference(request.id),
      status: "on_the_way",
      mechanic: getAssignedMechanic(state.acceptedMechanicId),
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
    if (state.quotationResponse !== "accepted") {
      return res.status(409).json({
        success: false,
        message: "Accept the quotation before completing service.",
      });
    }

    if (!state.completion) {
      const problemWork = mockWorkByProblem[request.problem] ||
        mockWorkByProblem.Other;
      state.completion = {
        status: "completed",
        completedAt: new Date().toISOString(),
        workCompleted: problemWork.work,
        problemTitle: problemWork.title,
        mechanic: getAssignedMechanic(state.acceptedMechanicId),
        responseTimeMinutes: mockTracking.etaMinutes,
      };
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
    if (state.quotationResponse !== "accepted" || !state.completion) {
      return res.status(409).json({
        success: false,
        message: "Complete the service before submitting payment.",
      });
    }

    const {
      paymentMethod,
      tip = 0,
      rating,
      feedbackTags = [],
      review = "",
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

    if (
      rating !== undefined &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5.",
      });
    }

    if (
      !Array.isArray(feedbackTags) ||
      feedbackTags.some((tag) => typeof tag !== "string") ||
      typeof review !== "string" ||
      review.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Review or feedback is invalid.",
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
      rating: rating ?? null,
      feedbackTags,
      review: review.trim(),
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
      mechanic: getAssignedMechanic(state.acceptedMechanicId),
      quotation: mockQuotation,
      completion: state.completion,
      payment: state.payment,
    });
  } catch (error) {
    return handleError(res, "Get mock service summary error", error);
  }
};
