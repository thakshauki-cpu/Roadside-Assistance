import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { io as ioClient } from "../../Frontend/node_modules/socket.io-client/build/esm/index.js";
import connectDB from "../config/db.js";
import app from "../app.js";
import { initSocket } from "../socket.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import MechanicProfile from "../models/MechanicProfile.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
};

const connectSocket = (url, token) =>
  new Promise((resolve, reject) => {
    const s = ioClient(url, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      reconnection: false,
    });
    const timer = setTimeout(() => {
      s.disconnect();
      reject(new Error("Socket connect timeout"));
    }, 5000);
    s.on("connect", () => {
      clearTimeout(timer);
      resolve(s);
    });
    s.on("connect_error", (err) => {
      clearTimeout(timer);
      s.disconnect();
      reject(err);
    });
  });

const waitForEvent = (socket, eventName, timeoutMs = 4000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout waiting for socket event: ${eventName}`)),
      timeoutMs
    );
    socket.once(eventName, (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

const run = async () => {
  let httpServer;
  const createdUserIds = [];
  const createdRequestIds = [];
  const sockets = [];

  try {
    await connectDB();
    const PORT = 5597;
    httpServer = http.createServer(app);
    initSocket(httpServer);
    await new Promise((resolve) => httpServer.listen(PORT, resolve));
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
    const customer1 = await User.create({
      fullName: "P3 Customer 1",
      email: `p3_c1_${ts}@test.com`,
      mobile: "+94771110001",
      password: "password123",
      role: "customer",
    });
    const customer2 = await User.create({
      fullName: "P3 Customer 2",
      email: `p3_c2_${ts}@test.com`,
      mobile: "+94771110002",
      password: "password123",
      role: "customer",
    });
    const mechanic = await User.create({
      fullName: "P3 Mechanic",
      email: `p3_m1_${ts}@test.com`,
      mobile: "+94771110003",
      password: "password123",
      role: "mechanic",
    });
    createdUserIds.push(customer1._id, customer2._id, mechanic._id);

    await MechanicProfile.create({
      user: mechanic._id,
      businessName: "P3 Garage",
      services: ["Tyre Repair", "Engine Breakdown"],
      phone: "+94771110003",
      isAvailable: true,
      serviceRadius: 20,
      isVerified: true,
      verificationStatus: "approved",
      location: { address: "P3 Road", coordinates: [10.01, 10.01] },
    });

    const c1Token = jwt.sign({ id: customer1._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const c2Token = jwt.sign({ id: customer2._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const mToken = jwt.sign({ id: mechanic._id, role: "mechanic" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const expiredToken = jwt.sign({ id: customer1._id, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "-10s" });

    // 1. Security: Guest / invalid / expired JWT rejected by Socket.IO
    console.log("\n--- TEST 1: Socket.IO Auth Security ---");
    let guestRejected = false;
    try {
      await connectSocket(BASE_URL, null);
    } catch {
      guestRejected = true;
    }
    assert(guestRejected, "Guest socket without token must be rejected");

    let expiredRejected = false;
    try {
      await connectSocket(BASE_URL, expiredToken);
    } catch {
      expiredRejected = true;
    }
    assert(expiredRejected, "Expired JWT socket must be rejected");
    console.log("✓ TEST 1 PASSED: Unauthenticated & expired sockets rejected.");

    // Connect authenticated sockets
    const c1Socket = await connectSocket(BASE_URL, c1Token);
    const c2Socket = await connectSocket(BASE_URL, c2Token);
    const mSocket = await connectSocket(BASE_URL, mToken);
    sockets.push(c1Socket, c2Socket, mSocket);

    // 2. Customer 1 creates request -> Mechanic receives `new_service_request` via Socket.IO
    console.log("\n--- TEST 2: Real-Time Dispatch & Room Authorization ---");
    const newReqPromise = waitForEvent(mSocket, "new_service_request");
    const createRes = await api(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: { address: "Test Spot", coordinates: [10.0, 10.0] },
          vehicle: { vehicleType: "Car", model: "Axio", registrationNumber: `P3-${ts}` },
          problem: "Puncture",
          description: "Flat tyre",
        }),
      },
      c1Token
    );
    assert(createRes.status === 201, "Create request failed");
    const reqId = createRes.data.serviceRequest._id;
    createdRequestIds.push(reqId);

    const newReqEvent = await newReqPromise;
    assert(newReqEvent._id === reqId, "Mechanic did not receive new_service_request via Socket.IO");

    // Unauthorized Customer 2 tries to join Customer 1's request room
    const c2JoinAck = await new Promise((resolve) =>
      c2Socket.emit("join_request", reqId, resolve)
    );
    assert(c2JoinAck?.ok === false, "Unauthorized customer must NOT join another customer's request room");

    // Authorized Customer 1 joins request room
    const c1JoinAck = await new Promise((resolve) =>
      c1Socket.emit("join_request", reqId, resolve)
    );
    assert(c1JoinAck?.ok === true, "Owner customer must be allowed to join request room");
    console.log("✓ TEST 2 PASSED: Real-time dispatch & room authorization enforced.");

    // 3. Accept -> Inspection Fee -> Payment -> On the Way -> Real GPS -> Persistence
    console.log("\n--- TEST 3: Standardized Events & Real GPS Persistence ---");
    const acceptedPromise = waitForEvent(c1Socket, "service_request_accepted");
    const accRes = await api(`/api/service-requests/mechanic/${reqId}/accept`, { method: "PATCH" }, mToken);
    assert(accRes.status === 200, "Accept failed");
    const accEv = await acceptedPromise;
    assert(accEv.status === "accepted", "Customer did not receive service_request_accepted");

    const feePromise = waitForEvent(c1Socket, "inspection_fee_submitted");
    const feeRes = await api(
      `/api/service-requests/mechanic/${reqId}/inspection-fee`,
      {
        method: "POST",
        body: JSON.stringify({ travelFee: 500, visitFee: 300, inspectionCharge: 700 }),
      },
      mToken
    );
    assert(feeRes.status === 200, "Submit inspection fee failed");
    const feeEv = await feePromise;
    assert(feeEv.inspectionFee?.totalAmount === 1500, "Customer did not receive inspection_fee_submitted");

    // GPS before on_the_way must be rejected
    const earlyGps = await api(
      `/api/service-requests/mechanic/${reqId}/location`,
      { method: "PATCH", body: JSON.stringify({ latitude: 10.005, longitude: 10.005 }) },
      mToken
    );
    assert(earlyGps.status === 400, "GPS update before on_the_way must be rejected");

    const inspPayPromise = waitForEvent(mSocket, "inspection_payment_completed");
    const payRes = await api(
      `/api/get-help/${reqId}/pay-inspection`,
      { method: "POST", body: JSON.stringify({ paymentMethod: "card" }) },
      c1Token
    );
    assert(payRes.status === 200, "Pay inspection failed");
    const payEv = await inspPayPromise;
    assert(payEv.status === "inspection_paid", "Mechanic did not receive inspection_payment_completed");

    const onWayPromise = waitForEvent(c1Socket, "mechanic_on_the_way");
    const onWayRes = await api(`/api/service-requests/mechanic/${reqId}/on-the-way`, { method: "PATCH" }, mToken);
    assert(onWayRes.status === 200, "On the way failed");
    await onWayPromise;

    // Send real GPS update -> Customer receives `mechanic_location_updated` & persisted in MongoDB
    const gpsPromise = waitForEvent(c1Socket, "mechanic_location_updated");
    const gpsRes = await api(
      `/api/service-requests/mechanic/${reqId}/location`,
      {
        method: "PATCH",
        body: JSON.stringify({ latitude: 10.006, longitude: 10.007, accuracy: 12 }),
      },
      mToken
    );
    assert(gpsRes.status === 200, "GPS update failed");
    const gpsEv = await gpsPromise;
    assert(
      gpsEv.mechanicLocation?.coordinates?.[0] === 10.007 &&
        gpsEv.mechanicLocation?.coordinates?.[1] === 10.006,
      "Customer did not receive exact mechanic_location_updated coordinates"
    );

    // Refresh recovery: GET /tracking returns persisted mechanicLocation
    const trackRes = await api(`/api/get-help/${reqId}/tracking`, {}, c1Token);
    assert(
      trackRes.data.mechanicLocation?.coordinates?.[0] === 10.007 &&
        trackRes.data.mechanicLocation?.coordinates?.[1] === 10.006,
      "Persisted mechanicLocation must survive refresh via /tracking"
    );
    console.log("✓ TEST 3 PASSED: Standardized events, GPS persistence, and room broadcast verified.");

    console.log("\n=== ALL PHASE 3 SOCKET & GPS TESTS PASSED ===");
  } finally {
    sockets.forEach((s) => s.disconnect());
    if (createdRequestIds.length > 0) {
      await Payment.deleteMany({ serviceRequest: { $in: createdRequestIds } });
      await Notification.deleteMany({ serviceRequest: { $in: createdRequestIds } });
      await ServiceRequest.deleteMany({ _id: { $in: createdRequestIds } });
    }
    if (createdUserIds.length > 0) {
      await Vehicle.deleteMany({ user: { $in: createdUserIds } });
      await MechanicProfile.deleteMany({ user: { $in: createdUserIds } });
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    if (httpServer) httpServer.close();
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("PHASE 3 TEST FAILED:", err);
  process.exit(1);
});
