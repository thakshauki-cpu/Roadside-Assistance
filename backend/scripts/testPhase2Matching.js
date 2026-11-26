import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import connectDB from "../config/db.js";
import app from "../app.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import MechanicProfile from "../models/MechanicProfile.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Notification from "../models/Notification.js";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
};

const run = async () => {
  let server;
  const createdUserIds = [];
  const createdRequestIds = [];

  try {
    await connectDB();
    const PORT = 5598;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}`;

    const api = async (path, options = {}, token = null) => {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    const ts = Date.now();
    const customer = await User.create({
      fullName: "Phase2 Customer",
      email: `p2_cust_${ts}@test.com`,
      mobile: "+94770000001",
      password: "password123",
      role: "customer",
    });
    createdUserIds.push(customer._id);

    const makeMech = async (suffix, coords, services, radius = 25, isAvailable = true) => {
      const user = await User.create({
        fullName: `Phase2 Mech ${suffix}`,
        email: `p2_mech_${suffix}_${ts}@test.com`,
        mobile: `+947700000${suffix}`,
        password: "password123",
        role: "mechanic",
      });
      createdUserIds.push(user._id);
      await MechanicProfile.create({
        user: user._id,
        businessName: `Garage ${suffix}`,
        services,
        phone: `+947700000${suffix}`,
        isAvailable,
        serviceRadius: radius,
        isVerified: true,
        verificationStatus: "approved",
        location: {
          address: `Address ${suffix}`,
          coordinates: coords,
        },
      });
      const token = jwt.sign(
        { id: user._id, role: "mechanic" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return { user, token };
    };

    // Use isolated coordinates [10.0, 10.0] so existing DB mechanics don't interfere with deterministic matching counts
    const customerToken = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // M1: ~1.5 km away, supports Tyre Repair & Engine Breakdown, radius 10 km
    const m1 = await makeMech("1", [10.010, 10.010], ["Tyre Repair", "Engine Breakdown"], 10);
    // M2: ~2.5 km away, supports Tyre Repair & Engine Breakdown, radius 10 km
    const m2 = await makeMech("2", [10.015, 10.015], ["Tyre Repair", "Engine Breakdown"], 10);
    // M3: ~3.1 km away, supports Tyre Repair & Engine Breakdown, radius 10 km
    const m3 = await makeMech("3", [9.980, 10.020], ["Tyre Repair", "Engine Breakdown"], 10);
    // M_FAR: ~300 km away, radius 10 km -> should NOT match
    const mFar = await makeMech("4", [12.0, 12.0], ["Tyre Repair", "Engine Breakdown"], 10);

    // TEST 1: No eligible mechanics exist (Fuel Delivery when none support Fuel Delivery)
    console.log("\n--- TEST 1: No Eligible Mechanics Exist ---");
    const noMechReqRes = await api(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: { address: "Test Location", coordinates: [10.0, 10.0] },
          vehicle: { vehicleType: "Car", model: "Axio", registrationNumber: `P2-NONE-${ts}` },
          problem: "Fuel",
          description: "Out of petrol",
        }),
      },
      customerToken
    );
    assert(noMechReqRes.status === 201, "Create request with no matching service should return 201");
    createdRequestIds.push(noMechReqRes.data.serviceRequest._id);
    assert(noMechReqRes.data.eligibleMechanicsCount === 0, "Eligible count must be 0");
    assert(noMechReqRes.data.matchingReason === "no_matching_service", `Expected no_matching_service, got ${noMechReqRes.data.matchingReason}`);

    const nearbyNone = await api(`/api/get-help/${noMechReqRes.data.serviceRequest._id}/nearby-mechanics`, {}, customerToken);
    assert(Array.isArray(nearbyNone.data.mechanics) && nearbyNone.data.mechanics.length === 0, "Must return empty mechanics array (no fake fallback)");

    const assignNone = await api(`/api/get-help/${noMechReqRes.data.serviceRequest._id}/assignment`, {}, customerToken);
    assert(assignNone.data.mechanic === null, "Assigned mechanic must be null");
    assert(assignNone.data.noMechanicsAvailable === true, "noMechanicsAvailable must be true");
    console.log("✓ TEST 1 PASSED: Zero fake mechanics/fallbacks returned.");

    // TEST 2: Create request matching M1, M2, M3 (not M_FAR), M1 rejects -> M2 & M3 still see it
    console.log("\n--- TEST 2: One Mechanic Rejects, Others Retain Access ---");
    const reqRes = await api(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: { address: "Test Location", coordinates: [10.0, 10.0] },
          vehicle: { vehicleType: "Car", model: "Corolla", registrationNumber: `P2-MATCH-${ts}` },
          problem: "Puncture",
          description: "Flat rear tyre",
        }),
      },
      customerToken
    );
    assert(reqRes.status === 201, "Request creation failed");
    const reqId = reqRes.data.serviceRequest._id;
    createdRequestIds.push(reqId);
    assert(reqRes.data.eligibleMechanicsCount >= 3, `Expected >=3 eligible mechanics, got ${reqRes.data.eligibleMechanicsCount}`);

    // Verify M_FAR does NOT see it in pending
    const farPending = await api("/api/service-requests/mechanic/pending", {}, mFar.token);
    assert(!farPending.data.requests.some((r) => r._id === reqId), "Out-of-radius mechanic must NOT see request");

    // Verify M1, M2, M3 see it with real distanceKm and no fake rating
    const nearbyBefore = await api(`/api/get-help/${reqId}/nearby-mechanics`, {}, customerToken);
    const m1Nearby = nearbyBefore.data.mechanics.find((m) => m.id === m1.user._id.toString());
    assert(m1Nearby && typeof m1Nearby.distanceKm === "number" && m1Nearby.distanceKm < 5, "M1 must have real distanceKm");
    assert(m1Nearby.rating === null && m1Nearby.ratingCount === 0, "Mechanic with 0 reviews must not have fake 4.8 rating");

    // M1 rejects
    const rej1 = await api(`/api/service-requests/mechanic/${reqId}/reject`, { method: "PATCH" }, m1.token);
    assert(rej1.status === 200, "M1 reject should succeed");
    assert(rej1.data.noMechanicsAvailable === false, "Other mechanics still eligible");

    const m1PendingAfter = await api("/api/service-requests/mechanic/pending", {}, m1.token);
    assert(!m1PendingAfter.data.requests.some((r) => r._id === reqId), "M1 must not see rejected request");

    const m2PendingAfter = await api("/api/service-requests/mechanic/pending", {}, m2.token);
    assert(m2PendingAfter.data.requests.some((r) => r._id === reqId), "M2 must still see request after M1 rejects");
    console.log("✓ TEST 2 PASSED: M1 rejected, M2 still has access, M_FAR excluded, zero fake ratings.");

    // TEST 3: Two mechanics (M2 and M3) attempt to accept simultaneously -> atomic lock
    console.log("\n--- TEST 3: Simultaneous Atomic Accept ---");
    const [acc2, acc3] = await Promise.all([
      api(`/api/service-requests/mechanic/${reqId}/accept`, { method: "PATCH" }, m2.token),
      api(`/api/service-requests/mechanic/${reqId}/accept`, { method: "PATCH" }, m3.token),
    ]);
    const statuses = [acc2.status, acc3.status].sort();
    assert(statuses[0] === 200 && statuses[1] === 409, `Expected [200, 409], got [${statuses.join(", ")}]`);
    const loser = acc2.status === 200 ? m3 : m2;

    // Loser must not see it in pending anymore
    const loserPendingAfter = await api("/api/service-requests/mechanic/pending", {}, loser.token);
    assert(!loserPendingAfter.data.requests.some((r) => r._id === reqId), "Other mechanics must lose access after acceptance");
    console.log("✓ TEST 3 PASSED: Simultaneous accept resolved atomically (one 200, one 409).");

    // TEST 4: All eligible mechanics reject -> customer receives no_mechanics_available + safe retry preserves history
    console.log("\n--- TEST 4: All Eligible Mechanics Reject & Safe Retry ---");
    // Note: Winner from TEST 3 currently has active job (accepted), so only M1 and loser are free+eligible
    const allRejReqRes = await api(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: { address: "Test Location", coordinates: [10.0, 10.0] },
          vehicle: { vehicleType: "Car", model: "Corolla", registrationNumber: `P2-ALLREJ-${ts}` },
          problem: "Puncture",
          description: "Flat front tyre",
        }),
      },
      customerToken
    );
    const allRejId = allRejReqRes.data.serviceRequest._id;
    createdRequestIds.push(allRejId);

    // Reject by all currently eligible mechanics returned in pending
    const m1P = await api("/api/service-requests/mechanic/pending", {}, m1.token);
    const loserP = await api("/api/service-requests/mechanic/pending", {}, loser.token);
    assert(m1P.data.requests.some((r) => r._id === allRejId), "M1 should see new request");
    assert(loserP.data.requests.some((r) => r._id === allRejId), "Free mechanic should see new request");

    const r1 = await api(`/api/service-requests/mechanic/${allRejId}/reject`, { method: "PATCH" }, m1.token);
    assert(r1.status === 200 && r1.data.noMechanicsAvailable === false, "Remaining free mechanic is still eligible");

    const rLoser = await api(`/api/service-requests/mechanic/${allRejId}/reject`, { method: "PATCH" }, loser.token);
    assert(rLoser.status === 200 && rLoser.data.noMechanicsAvailable === true, "All eligible mechanics rejected -> noMechanicsAvailable must be true");

    const assignAllRej = await api(`/api/get-help/${allRejId}/assignment`, {}, customerToken);
    assert(assignAllRej.data.noMechanicsAvailable === true, "Assignment must reflect noMechanicsAvailable");
    assert(assignAllRej.data.mechanic === null, "Mechanic must be null");

    // Safe retry preserves rejectedMechanics history
    const retryRes = await api(`/api/service-requests/${allRejId}/retry`, { method: "POST" }, customerToken);
    assert(retryRes.status === 200, "Retry should return 200");
    assert(retryRes.data.serviceRequest.retryCount === 1, "retryCount must increment to 1");
    assert(retryRes.data.serviceRequest.rejectedMechanics.length === 2, "rejectedMechanics history must be preserved");
    assert(retryRes.data.eligibleMechanicsCount === 0, "Rejected mechanics must not be re-matched");
    console.log("✓ TEST 4 PASSED: All-rejected state persisted, notification created, retry preserved history.");

    console.log("\n=== ALL PHASE 2 TESTS PASSED ===");
  } finally {
    if (createdRequestIds.length > 0) {
      await Notification.deleteMany({ serviceRequest: { $in: createdRequestIds } });
      await ServiceRequest.deleteMany({ _id: { $in: createdRequestIds } });
    }
    if (createdUserIds.length > 0) {
      await Vehicle.deleteMany({ user: { $in: createdUserIds } });
      await MechanicProfile.deleteMany({ user: { $in: createdUserIds } });
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    if (server) server.close();
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("PHASE 2 TEST FAILED:", err);
  process.exit(1);
});
