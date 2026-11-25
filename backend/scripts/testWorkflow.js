import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import app from "../app.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import MechanicProfile from "../models/MechanicProfile.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import jwt from "jsonwebtoken";

const runWorkflowTest = async () => {
  let server;
  try {
    console.log("=== STARTING COMPLETE WORKFLOW TEST ===");
    await connectDB();

    const PORT = 5599;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}`;

    // 1. Setup Test Customer & Mechanic with JWT tokens
    const customerEmail = `test_customer_${Date.now()}@example.com`;
    const mechanicEmail = `test_mechanic_${Date.now()}@example.com`;

    const customerUser = await User.create({
      fullName: "Test Customer Kumar",
      email: customerEmail,
      mobile: "+94771234567",
      password: "password123",
      role: "customer",
    });

    const mechanicUser = await User.create({
      fullName: "Test Mechanic Silva",
      email: mechanicEmail,
      mobile: "+94779876543",
      password: "password123",
      role: "mechanic",
    });

    // Create approved mechanic profile
    const mechanicProfile = await MechanicProfile.create({
      user: mechanicUser._id,
      businessName: "Silva Auto Garage",
      services: ["Engine Breakdown", "Battery Jumpstart", "Tyre Repair"],
      phone: "+94779876543",
      isAvailable: true,
      isVerified: true,
      verificationStatus: "approved",
      location: {
        address: "Kallady Beach Road, Batticaloa",
        coordinates: [81.7088, 7.7102],
      },
    });

    const customerToken = jwt.sign(
      { id: customerUser._id, role: "customer" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    const mechanicToken = jwt.sign(
      { id: mechanicUser._id, role: "mechanic" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    console.log("✓ Test users & mechanic profile created.");

    // Helper for authenticated fetch
    const apiCall = async (path, options = {}, token = null) => {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };
      const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
      const data = await response.json();
      return { status: response.status, data };
    };

    // ==========================================
    // STEP 1: Customer creates Get Help request
    // ==========================================
    console.log("\n--- STEP 1: Customer Creates Get Help Request ---");
    const createReqRes = await apiCall(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: {
            address: "Clock Tower Junction, Batticaloa",
            landmark: "Near Bus Stand",
            coordinates: [81.6924, 7.717],
          },
          vehicle: {
            vehicleType: "Car",
            model: "Toyota Corolla",
            registrationNumber: `WP-CAB-${Math.floor(1000 + Math.random() * 9000)}`,
          },
          problem: "Engine Overheating",
          description: "Engine temperature gauge red, steam coming from hood",
        }),
      },
      customerToken
    );

    if (createReqRes.status !== 201) {
      throw new Error(`Step 1 failed: ${JSON.stringify(createReqRes.data)}`);
    }
    const requestId = createReqRes.data.serviceRequest._id;
    console.log(`✓ Request created successfully with ID: ${requestId}`);
    console.log(`  Initial status: ${createReqRes.data.serviceRequest.status}`);

    // Mechanic accepts the request
    console.log("\n--- Mechanic Accepts Service Request ---");
    const acceptRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/accept`,
      { method: "PATCH" },
      mechanicToken
    );
    if (acceptRes.status !== 200) {
      throw new Error(`Accept failed: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log(`✓ Mechanic accepted request. Status: ${acceptRes.data.serviceRequest.status}`);

    // ==========================================
    // STEP 2: Mechanic sends Inspection Fee
    // ==========================================
    console.log("\n--- STEP 2: Mechanic Submits Inspection Fee ---");
    const inspectionFeePayload = {
      travelFee: 600,
      visitFee: 400,
      inspectionCharge: 1000,
      description: "Travelling to Clock Tower + on-site vehicle diagnosis",
    };
    const submitFeeRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/inspection-fee`,
      {
        method: "POST",
        body: JSON.stringify(inspectionFeePayload),
      },
      mechanicToken
    );

    if (submitFeeRes.status !== 200) {
      throw new Error(`Step 2 failed: ${JSON.stringify(submitFeeRes.data)}`);
    }
    console.log(`✓ Inspection fee submitted.`);
    console.log(`  Total Inspection Fee: Rs. ${submitFeeRes.data.serviceRequest.inspectionFee.totalAmount}`);
    console.log(`  New Status: ${submitFeeRes.data.serviceRequest.status}`);

    // Rule 1 Verification: Mechanic tries to travel BEFORE inspection fee payment
    console.log("\n--- RULE 1 CHECK: Mechanic tries to travel before inspection payment ---");
    const prematureTravelRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/on-the-way`,
      { method: "PATCH" },
      mechanicToken
    );
    if (prematureTravelRes.status === 400) {
      console.log(`✓ PASS: Mechanic blocked from travelling before inspection payment (HTTP 400).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 400 but got ${prematureTravelRes.status}`);
    }

    // ==========================================
    // STEP 3: Customer pays Inspection Fee (Demo)
    // ==========================================
    console.log("\n--- STEP 3: Customer Pays Inspection Fee (Demo) ---");
    const payInspectionRes = await apiCall(
      `/api/get-help/${requestId}/pay-inspection`,
      {
        method: "POST",
        body: JSON.stringify({ paymentMethod: "card" }),
      },
      customerToken
    );
    if (payInspectionRes.status !== 200) {
      throw new Error(`Step 3 failed: ${JSON.stringify(payInspectionRes.data)}`);
    }
    console.log(`✓ Inspection fee demo payment confirmed!`);
    console.log(`  Inspection Payment Status: ${payInspectionRes.data.serviceRequest.inspectionPayment.status}`);
    console.log(`  Demo Transaction ID: ${payInspectionRes.data.payment.transactionId}`);
    console.log(`  New Status: ${payInspectionRes.data.serviceRequest.status}`);

    // Rule 7 Verification: Duplicate inspection payment check
    console.log("\n--- RULE 7 CHECK: Prevent duplicate payment for inspection fee ---");
    const duplicateInspectionPayRes = await apiCall(
      `/api/get-help/${requestId}/pay-inspection`,
      {
        method: "POST",
        body: JSON.stringify({ paymentMethod: "card" }),
      },
      customerToken
    );
    if (duplicateInspectionPayRes.status === 409) {
      console.log(`✓ PASS: Duplicate inspection payment correctly rejected (HTTP 409).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 409 but got ${duplicateInspectionPayRes.status}`);
    }

    // ==========================================
    // STEP 4: Mechanic Notification after Inspection Payment
    // ==========================================
    console.log("\n--- STEP 4: Check Notifications after Inspection Payment ---");
    const mechNotifRes = await apiCall("/api/notifications", { method: "GET" }, mechanicToken);
    const mechNotifs = mechNotifRes.data.notifications || [];
    const inspectionPaidNotif = mechNotifs.find((n) => n.type === "inspection_paid");
    if (!inspectionPaidNotif) {
      throw new Error("Step 4 failed: Mechanic did not receive 'inspection_paid' notification.");
    }
    console.log(`✓ PASS: Mechanic received notification: "${inspectionPaidNotif.title} - ${inspectionPaidNotif.message}"`);

    // ==========================================
    // STEP 5: Mechanic travels to customer location
    // ==========================================
    console.log("\n--- STEP 5: Mechanic Starts Travel (On The Way) ---");
    const travelRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/on-the-way`,
      { method: "PATCH" },
      mechanicToken
    );
    if (travelRes.status !== 200) {
      throw new Error(`Step 5 travel failed: ${JSON.stringify(travelRes.data)}`);
    }
    console.log(`✓ Status updated to: ${travelRes.data.serviceRequest.status}`);

    // Verify Tracking API for customer (STEP 6)
    const trackingRes1 = await apiCall(`/api/get-help/${requestId}/tracking`, { method: "GET" }, customerToken);
    if (trackingRes1.data.status !== "on_the_way") {
      throw new Error(`Tracking status mismatch. Expected 'on_the_way', got ${trackingRes1.data.status}`);
    }
    console.log(`✓ Customer tracking verifies status is 'on_the_way'.`);

    // Mechanic marks arrived
    console.log("\n--- Mechanic Marks Arrived ---");
    const arrivedRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/arrived`,
      { method: "PATCH" },
      mechanicToken
    );
    if (arrivedRes.status !== 200) {
      throw new Error(`Step 5 arrival failed: ${JSON.stringify(arrivedRes.data)}`);
    }
    console.log(`✓ Status updated to: ${arrivedRes.data.serviceRequest.status}`);

    // Verify Tracking API for customer (STEP 6)
    const trackingRes2 = await apiCall(`/api/get-help/${requestId}/tracking`, { method: "GET" }, customerToken);
    if (trackingRes2.data.status !== "arrived") {
      throw new Error(`Tracking status mismatch. Expected 'arrived', got ${trackingRes2.data.status}`);
    }
    console.log(`✓ Customer tracking verifies status is 'arrived'.`);

    // ==========================================
    // STEP 7: Mechanic inspects vehicle
    // ==========================================
    console.log("\n--- STEP 7: Vehicle Inspection ---");
    // Start inspection
    const startInspRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/start-inspection`,
      { method: "PATCH" },
      mechanicToken
    );
    if (startInspRes.status !== 200) {
      throw new Error(`Start inspection failed: ${JSON.stringify(startInspRes.data)}`);
    }
    console.log(`✓ Status updated to: ${startInspRes.data.serviceRequest.status}`);

    // Rule 2 Check: Try to submit quotation BEFORE inspection completion
    console.log("\n--- RULE 2 CHECK: Mechanic tries to submit repair quotation before inspection completes ---");
    const prematureQuoteRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/repair-quotation`,
      {
        method: "POST",
        body: JSON.stringify({ labourCharge: 3000, partsCharge: 2000, description: "Radiator fix" }),
      },
      mechanicToken
    );
    if (prematureQuoteRes.status === 400) {
      console.log(`✓ PASS: Quotation submission blocked before inspection completion (HTTP 400).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 400 but got ${prematureQuoteRes.status}`);
    }

    // Complete inspection
    const completeInspRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/complete-inspection`,
      { method: "PATCH" },
      mechanicToken
    );
    if (completeInspRes.status !== 200) {
      throw new Error(`Complete inspection failed: ${JSON.stringify(completeInspRes.data)}`);
    }
    console.log(`✓ Inspection completed. Status: ${completeInspRes.data.serviceRequest.status}`);

    // ==========================================
    // STEP 8: Mechanic sends Repair Quotation
    // ==========================================
    console.log("\n--- STEP 8: Mechanic Sends Repair Quotation ---");
    const quotePayload = {
      labourCharge: 3500,
      partsCharge: 2500,
      additionalCharges: 500,
      description: "Replace radiator hose, coolant refill & pressure testing",
    };
    const submitQuoteRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/repair-quotation`,
      {
        method: "POST",
        body: JSON.stringify(quotePayload),
      },
      mechanicToken
    );
    if (submitQuoteRes.status !== 200) {
      throw new Error(`Submit repair quotation failed: ${JSON.stringify(submitQuoteRes.data)}`);
    }
    console.log(`✓ Repair quotation submitted.`);
    console.log(`  Repair Fee Total: Rs. ${submitQuoteRes.data.serviceRequest.repairQuotation.totalAmount}`);
    console.log(`  Status: ${submitQuoteRes.data.serviceRequest.status}`);

    // Rule 3 Check: Mechanic tries to complete repair before customer acceptance
    console.log("\n--- RULE 3 CHECK: Mechanic tries to complete repair before customer approval ---");
    const prematureCompleteRepairRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/complete-repair`,
      { method: "PATCH" },
      mechanicToken
    );
    if (prematureCompleteRepairRes.status === 400) {
      console.log(`✓ PASS: Repair completion blocked before customer approval (HTTP 400).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 400 but got ${prematureCompleteRepairRes.status}`);
    }

    // ==========================================
    // STEP 9: Customer accepts Repair Quotation
    // ==========================================
    console.log("\n--- STEP 9: Customer Accepts Repair Quotation ---");
    const acceptQuoteRes = await apiCall(
      `/api/get-help/${requestId}/repair-quotation-response`,
      {
        method: "POST",
        body: JSON.stringify({ response: "accepted" }),
      },
      customerToken
    );
    if (acceptQuoteRes.status !== 200) {
      throw new Error(`Accept repair quotation failed: ${JSON.stringify(acceptQuoteRes.data)}`);
    }
    console.log(`✓ Customer accepted quotation. Status: ${acceptQuoteRes.data.serviceRequest.status}`);

    // ==========================================
    // STEP 10: Repair Completion
    // ==========================================
    console.log("\n--- STEP 10: Mechanic Completes Repair ---");
    const completeRepairRes = await apiCall(
      `/api/service-requests/mechanic/${requestId}/complete-repair`,
      { method: "PATCH" },
      mechanicToken
    );
    if (completeRepairRes.status !== 200) {
      throw new Error(`Complete repair failed: ${JSON.stringify(completeRepairRes.data)}`);
    }
    console.log(`✓ Repair marked as completed. Status: ${completeRepairRes.data.serviceRequest.status}`);

    // ==========================================
    // STEP 11: Final Repair Fee Demo Payment
    // ==========================================
    console.log("\n--- STEP 11: Final Repair Fee Demo Payment ---");
    const payRepairRes = await apiCall(
      `/api/get-help/${requestId}/pay-repair`,
      {
        method: "POST",
        body: JSON.stringify({ paymentMethod: "card", tip: 300 }),
      },
      customerToken
    );
    if (payRepairRes.status !== 200) {
      throw new Error(`Pay repair fee failed: ${JSON.stringify(payRepairRes.data)}`);
    }
    console.log(`✓ Repair fee demo payment confirmed!`);
    console.log(`  Repair Payment Status: ${payRepairRes.data.serviceRequest.repairPayment.status}`);
    console.log(`  Total Paid (including tip): Rs. ${payRepairRes.data.serviceRequest.repairPayment.totalPaid}`);
    console.log(`  Final Request Status: ${payRepairRes.data.serviceRequest.status}`);

    // Rule 7 Verification: Duplicate repair payment check
    console.log("\n--- RULE 7 CHECK: Prevent duplicate repair fee payment ---");
    const duplicateRepairPayRes = await apiCall(
      `/api/get-help/${requestId}/pay-repair`,
      {
        method: "POST",
        body: JSON.stringify({ paymentMethod: "card" }),
      },
      customerToken
    );
    if (duplicateRepairPayRes.status === 409) {
      console.log(`✓ PASS: Duplicate repair payment correctly rejected (HTTP 409).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 409 but got ${duplicateRepairPayRes.status}`);
    }

    // Verify Separate Payment Records in MongoDB
    console.log("\n--- SEPARATE PAYMENT RECORDS CHECK IN MONGODB ---");
    const paymentsInDb = await Payment.find({ serviceRequest: requestId });
    console.log(`  Found ${paymentsInDb.length} payment records in MongoDB.`);
    const inspPayment = paymentsInDb.find((p) => p.paymentType === "inspection");
    const repPayment = paymentsInDb.find((p) => p.paymentType === "repair");

    if (!inspPayment || !repPayment) {
      throw new Error("FAIL: Both inspection and repair payments must exist as separate records in MongoDB!");
    }
    console.log(`✓ Inspection Payment Record: Rs. ${inspPayment.amount} (TX: ${inspPayment.transactionId})`);
    console.log(`✓ Repair Payment Record: Rs. ${repPayment.amount} (TX: ${repPayment.transactionId})`);

    // Verify Final Summary Endpoint
    console.log("\n--- FINAL SERVICE SUMMARY CHECK ---");
    const summaryRes = await apiCall(`/api/get-help/${requestId}/summary`, { method: "GET" }, customerToken);
    if (summaryRes.status !== 200) {
      throw new Error(`Summary failed: ${JSON.stringify(summaryRes.data)}`);
    }
    console.log(`✓ Summary returned successfully with:`);
    console.log(`  Status: ${summaryRes.data.status}`);
    console.log(`  Inspection Fee: Rs. ${summaryRes.data.inspectionFee?.totalAmount}`);
    console.log(`  Inspection Payment: ${summaryRes.data.inspectionPayment?.status}`);
    console.log(`  Repair Quotation Total: Rs. ${summaryRes.data.repairQuotation?.totalAmount}`);
    console.log(`  Repair Payment: ${summaryRes.data.repairPayment?.status}`);

    // ==========================================
    // REJECTION WORKFLOW BRANCH CHECK (STEP 9 Reject)
    // ==========================================
    console.log("\n--- TESTING REJECTION WORKFLOW BRANCH ---");
    const req2Res = await apiCall(
      "/api/service-requests",
      {
        method: "POST",
        body: JSON.stringify({
          location: { address: "Kallady Bridge", coordinates: [81.71, 7.71] },
          vehicle: { vehicleType: "Van", model: "Nissan Caravan", registrationNumber: `WP-NB-${Math.floor(1000 + Math.random() * 9000)}` },
          problem: "Flat Tire",
        }),
      },
      customerToken
    );
    if (!req2Res.data?.serviceRequest?._id) {
      throw new Error(`Rejection branch: request creation failed: ${JSON.stringify(req2Res.data)}`);
    }
    const req2Id = req2Res.data.serviceRequest._id;

    const r2Accept = await apiCall(`/api/service-requests/mechanic/${req2Id}/accept`, { method: "PATCH" }, mechanicToken);
    if (r2Accept.status !== 200) throw new Error(`Rejection branch: accept failed: ${JSON.stringify(r2Accept.data)}`);

    const r2Fee = await apiCall(`/api/service-requests/mechanic/${req2Id}/inspection-fee`, { method: "POST", body: JSON.stringify({ travelFee: 500, visitFee: 500, inspectionCharge: 1000 }) }, mechanicToken);
    if (r2Fee.status !== 200) throw new Error(`Rejection branch: inspection-fee failed: ${JSON.stringify(r2Fee.data)}`);

    const r2Pay = await apiCall(`/api/get-help/${req2Id}/pay-inspection`, { method: "POST", body: JSON.stringify({ paymentMethod: "card" }) }, customerToken);
    if (r2Pay.status !== 200) throw new Error(`Rejection branch: pay-inspection failed: ${JSON.stringify(r2Pay.data)}`);

    const r2OnWay = await apiCall(`/api/service-requests/mechanic/${req2Id}/on-the-way`, { method: "PATCH" }, mechanicToken);
    if (r2OnWay.status !== 200) throw new Error(`Rejection branch: on-the-way failed: ${JSON.stringify(r2OnWay.data)}`);

    const r2Arrived = await apiCall(`/api/service-requests/mechanic/${req2Id}/arrived`, { method: "PATCH" }, mechanicToken);
    if (r2Arrived.status !== 200) throw new Error(`Rejection branch: arrived failed: ${JSON.stringify(r2Arrived.data)}`);

    // FIX: start-inspection must be called before complete-inspection
    const r2StartInsp = await apiCall(`/api/service-requests/mechanic/${req2Id}/start-inspection`, { method: "PATCH" }, mechanicToken);
    if (r2StartInsp.status !== 200) throw new Error(`Rejection branch: start-inspection failed: ${JSON.stringify(r2StartInsp.data)}`);

    const r2CompleteInsp = await apiCall(`/api/service-requests/mechanic/${req2Id}/complete-inspection`, { method: "PATCH" }, mechanicToken);
    if (r2CompleteInsp.status !== 200) throw new Error(`Rejection branch: complete-inspection failed: ${JSON.stringify(r2CompleteInsp.data)}`);

    const r2Quote = await apiCall(`/api/service-requests/mechanic/${req2Id}/repair-quotation`, { method: "POST", body: JSON.stringify({ labourCharge: 8000, partsCharge: 12000 }) }, mechanicToken);
    if (r2Quote.status !== 200) throw new Error(`Rejection branch: repair-quotation failed: ${JSON.stringify(r2Quote.data)}`);

    // Customer REJECTS quotation
    const rejectRes = await apiCall(
      `/api/get-help/${req2Id}/repair-quotation-response`,
      { method: "POST", body: JSON.stringify({ response: "rejected", rejectionReason: "Cost too high" }) },
      customerToken
    );
    if (rejectRes.status !== 200 || !rejectRes.data?.serviceRequest) {
      throw new Error(`Rejection branch: quotation rejection failed (HTTP ${rejectRes.status}): ${JSON.stringify(rejectRes.data)}`);
    }
    console.log(`✓ Rejection response: ${rejectRes.data.serviceRequest.status}`);
    if (rejectRes.data.serviceRequest.status !== "repair_rejected") {
      throw new Error("Expected status 'repair_rejected'");
    }

    // Verify Rule 4: Customer rejection means no repair fee is payable
    const tryPayRejectedRes = await apiCall(
      `/api/get-help/${req2Id}/pay-repair`,
      { method: "POST", body: JSON.stringify({ paymentMethod: "card" }) },
      customerToken
    );
    if (tryPayRejectedRes.status === 400) {
      console.log(`✓ PASS: Rule 4 enforced - customer cannot pay repair fee after rejection (HTTP 400).`);
    } else {
      throw new Error(`FAIL: Expected HTTP 400 on paying rejected repair but got ${tryPayRejectedRes.status}`);
    }

    // Cleanup test data
    console.log("\n--- Cleaning up test records ---");
    await Payment.deleteMany({ serviceRequest: { $in: [requestId, req2Id] } });
    await Notification.deleteMany({ serviceRequest: { $in: [requestId, req2Id] } });
    await ServiceRequest.deleteMany({ _id: { $in: [requestId, req2Id] } });
    await Vehicle.deleteMany({ user: customerUser._id });
    await MechanicProfile.deleteOne({ _id: mechanicProfile._id });
    await User.deleteMany({ _id: { $in: [customerUser._id, mechanicUser._id] } });
    console.log("✓ Test records cleaned up.");

    console.log("\n==========================================");
    console.log("ALL WORKFLOW & BUSINESS RULE TESTS PASSED!");
    console.log("==========================================");
  } catch (error) {
    console.error("\n❌ TEST ERROR:", error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit();
  }
};

runWorkflowTest();
