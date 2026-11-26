import MechanicProfile from "../models/MechanicProfile.js";
import Review from "../models/Review.js";
import ServiceRequest from "../models/ServiceRequest.js";

export const ACTIVE_JOB_STATUSES = [
  "accepted",
  "inspection_fee_submitted",
  "inspection_paid",
  "on_the_way",
  "arrived",
  "inspecting",
  "inspection_completed",
  "quotation_submitted",
  "repair_in_progress",
  "repair_completed",
];

const EARTH_RADIUS_KM = 6371;
const DEFAULT_SERVICE_RADIUS_KM = 25;

const PROBLEM_SERVICE_MAP = {
  puncture: ["Tyre Repair", "General Repair"],
  "tyre repair": ["Tyre Repair", "General Repair"],
  battery: ["Battery Jumpstart", "General Repair"],
  "battery jumpstart": ["Battery Jumpstart", "General Repair"],
  engine: ["Engine Breakdown", "General Repair"],
  "engine breakdown": ["Engine Breakdown", "General Repair"],
  "engine overheating": ["Engine Breakdown", "General Repair"],
  "won't start": ["Engine Breakdown", "Battery Jumpstart", "General Repair"],
  fuel: ["Fuel Delivery", "General Repair"],
  "fuel delivery": ["Fuel Delivery", "General Repair"],
  accident: ["Towing", "General Repair"],
  towing: ["Towing", "General Repair"],
  other: ["General Repair"],
  "general repair": ["General Repair"],
};

export const mapProblemToServices = (problem) => {
  if (!problem || typeof problem !== "string") return [];
  const normalized = problem.trim().toLowerCase();

  if (PROBLEM_SERVICE_MAP[normalized]) {
    return PROBLEM_SERVICE_MAP[normalized];
  }

  const matched = new Set(["General Repair"]);
  if (normalized.includes("tyre") || normalized.includes("tire") || normalized.includes("puncture") || normalized.includes("flat")) {
    matched.add("Tyre Repair");
  }
  if (normalized.includes("battery") || normalized.includes("jump")) {
    matched.add("Battery Jumpstart");
  }
  if (normalized.includes("engine") || normalized.includes("overheat") || normalized.includes("start")) {
    matched.add("Engine Breakdown");
  }
  if (normalized.includes("fuel") || normalized.includes("petrol") || normalized.includes("diesel")) {
    matched.add("Fuel Delivery");
  }
  if (normalized.includes("tow") || normalized.includes("accident") || normalized.includes("crash")) {
    matched.add("Towing");
  }

  return Array.from(matched);
};

export const getValidCoordinates = (coordinates) => {
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

export const calculateDistanceKm = (first, second) => {
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

export const getBusyMechanicIds = async (excludeRequestId = null) => {
  const query = {
    mechanic: { $ne: null },
    status: { $in: ACTIVE_JOB_STATUSES },
  };
  if (excludeRequestId) {
    query._id = { $ne: excludeRequestId };
  }
  const activeRequests = await ServiceRequest.find(query)
    .select("mechanic")
    .lean();
  return new Set(
    activeRequests
      .map((r) => r.mechanic?.toString())
      .filter(Boolean)
  );
};

export const findEligibleMechanicsForRequest = async (request) => {
  const customerCoords = getValidCoordinates(request?.location?.coordinates);
  if (!customerCoords) {
    return {
      eligible: [],
      reason: "missing_customer_location",
      customerCoordinatesValid: false,
    };
  }

  const assignedMechanicId = request.mechanic?._id || request.mechanic;
  const rejectedSet = new Set(
    (request.rejectedMechanics || []).map((id) => id.toString())
  );
  const requiredServices = mapProblemToServices(request.problem);

  // If a mechanic is already assigned, return their real profile details
  if (assignedMechanicId) {
    const profile = await MechanicProfile.findOne({
      user: assignedMechanicId,
      isVerified: true,
      verificationStatus: "approved",
    })
      .populate("user", "fullName mobile email")
      .lean();

    if (!profile || !profile.user) {
      return { eligible: [], reason: null, customerCoordinatesValid: true };
    }

    const [ratingRows, completedCount] = await Promise.all([
      Review.aggregate([
        { $match: { mechanicId: profile.user._id } },
        {
          $group: {
            _id: "$mechanicId",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      ServiceRequest.countDocuments({
        mechanic: profile.user._id,
        status: "completed",
      }),
    ]);

    const mechCoords = getValidCoordinates(profile.location?.coordinates);
    const distanceKm = mechCoords
      ? Number(calculateDistanceKm(customerCoords, mechCoords).toFixed(1))
      : null;

    const ratingRow = ratingRows[0];

    return {
      eligible: [
        {
          id: profile.user._id.toString(),
          name: profile.businessName || profile.user.fullName,
          phone: profile.phone || profile.user.mobile || null,
          specialty: profile.services?.[0] || "General Repair",
          services: profile.services || [],
          rating: ratingRow ? Number(ratingRow.averageRating.toFixed(1)) : null,
          ratingCount: ratingRow ? ratingRow.totalReviews : 0,
          completedJobs: completedCount,
          distanceKm,
          serviceRadius: profile.serviceRadius || DEFAULT_SERVICE_RADIUS_KM,
          location: profile.location?.address || null,
          verified: Boolean(profile.isVerified),
          isAssigned: true,
        },
      ],
      reason: null,
      customerCoordinatesValid: true,
    };
  }

  // Otherwise find all approved, available mechanics
  const [profiles, busyMechanicIds] = await Promise.all([
    MechanicProfile.find({
      isAvailable: true,
      isVerified: true,
      verificationStatus: "approved",
    })
      .populate("user", "fullName mobile email")
      .lean(),
    getBusyMechanicIds(request._id),
  ]);

  if (profiles.length === 0) {
    return {
      eligible: [],
      reason: "no_mechanics_nearby",
      customerCoordinatesValid: true,
    };
  }

  let hasServiceMatch = false;
  let hasLocationMatch = false;
  let hasRadiusMatch = false;
  let hasUnrejectedMatch = false;

  const candidateProfiles = [];

  for (const profile of profiles) {
    if (!profile.user?._id) continue;
    const mechanicId = profile.user._id.toString();

    if (busyMechanicIds.has(mechanicId)) continue;

    const supportsService =
      requiredServices.length === 0 ||
      (Array.isArray(profile.services) &&
        profile.services.some((s) => requiredServices.includes(s)));
    if (!supportsService) continue;
    hasServiceMatch = true;

    const mechCoords = getValidCoordinates(profile.location?.coordinates);
    if (!mechCoords) continue;
    hasLocationMatch = true;

    const distance = calculateDistanceKm(customerCoords, mechCoords);
    const radiusKm = Number(profile.serviceRadius) || DEFAULT_SERVICE_RADIUS_KM;
    if (distance > radiusKm) continue;
    hasRadiusMatch = true;

    if (rejectedSet.has(mechanicId)) continue;
    hasUnrejectedMatch = true;

    candidateProfiles.push({ profile, mechanicId, distance, radiusKm });
  }

  if (candidateProfiles.length === 0) {
    let reason = "no_mechanics_nearby";
    if (!hasServiceMatch) {
      reason = "no_matching_service";
    } else if (!hasLocationMatch) {
      reason = "missing_mechanic_locations";
    } else if (!hasRadiusMatch) {
      reason = "no_mechanics_nearby";
    } else if (!hasUnrejectedMatch) {
      reason = "all_rejected";
    }

    return {
      eligible: [],
      reason,
      customerCoordinatesValid: true,
    };
  }

  const mechanicObjectIds = candidateProfiles.map((c) => c.profile.user._id);
  const [ratingRows, completedRows] = await Promise.all([
    Review.aggregate([
      { $match: { mechanicId: { $in: mechanicObjectIds } } },
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
          mechanic: { $in: mechanicObjectIds },
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

  const eligible = candidateProfiles
    .map(({ profile, mechanicId, distance, radiusKm }) => {
      const ratingRow = ratingsByMechanic.get(mechanicId);
      const completedJobs = completionsByMechanic.get(mechanicId) || 0;

      return {
        id: mechanicId,
        name: profile.businessName || profile.user.fullName,
        phone: profile.phone || profile.user.mobile || null,
        specialty: profile.services?.[0] || "General Repair",
        services: profile.services || [],
        rating: ratingRow ? Number(ratingRow.averageRating.toFixed(1)) : null,
        ratingCount: ratingRow ? ratingRow.totalReviews : 0,
        completedJobs,
        distanceKm: Number(distance.toFixed(1)),
        serviceRadius: radiusKm,
        location: profile.location?.address || null,
        verified: Boolean(profile.isVerified),
        isAssigned: false,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    eligible,
    reason: null,
    customerCoordinatesValid: true,
  };
};
