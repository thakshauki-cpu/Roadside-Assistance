import { useEffect, useState } from "react";
import {
  Check,
  ClipboardList,
  Clock,
  CircleDot,
  CarFront,
  BadgeCheck,
  Star,
  Banknote,
  CreditCard,
  QrCode,
  Wrench,
  ShieldCheck,
  MessageSquareQuote,
  ReceiptText,
  Download,
  Headset,
  AlertCircle,
  FileCheck,
} from "lucide-react";

import DashboardSidebar from "../../Dashboard/Sidebar";
import DashboardTopbar from "../../Dashboard/Topbar";
import RequestStepper from "../../gethelp/RequestStepper";
import {
  getAssignment,
  getCompletion,
  getCustomerReview,
  getServiceSummary,
  submitCustomerReview,
  payRepairFee,
} from "../../../api/getHelp";
import {
  formatRs,
  getCreatedRequestId,
  readCreatedRequest,
  readRequest,
} from "./requestSampleData";
import "../../styles/GetHelp.css";
import "../../styles/Summary.css";

const paymentMethods = [
  { id: "cash", name: "Cash (Demo)", text: "Simulate cash handover on-site", icon: Banknote },
  { id: "card", name: "Card (Demo)", text: "Visa / Mastercard Simulation", icon: CreditCard },
  { id: "qr", name: "LankaQR (Demo)", text: "LANKAQR Digital Simulation", icon: QrCode },
];

const ratingWords = ["", "Poor", "Fair", "Good", "Very Good", "Exceptional Service"];
const tipOptions = [0, 200, 500];

function Summary() {
  const requestId = getCreatedRequestId();
  const draft = readRequest();
  const createdRequest = readCreatedRequest();
  const [assignment, setAssignment] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  const [payment, setPayment] = useState("card");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [tip, setTip] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSettlementData = async () => {
      try {
        if (!requestId) {
          throw new Error("Your service request is missing. Please submit it again.");
        }
        const [assignmentData, completionData, reviewData, summaryData] = await Promise.all([
          getAssignment(requestId),
          getCompletion(requestId),
          getCustomerReview(requestId).catch(() => ({ review: null })),
          getServiceSummary(requestId).catch(() => null),
        ]);
        if (active) {
          setAssignment(assignmentData);
          setCompletion(completionData.completion);
          if (summaryData) setSummary(summaryData);
          if (reviewData?.review) {
            setReviewRecord(reviewData.review);
            setRating(reviewData.review.rating);
            setReview(reviewData.review.comment);
          }
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettlementData();
    return () => {
      active = false;
    };
  }, [requestId]);

  const mechanic = summary?.mechanic || completion?.mechanic || assignment?.mechanic || {};
  const status = summary?.status || assignment?.status || "completed";
  const isRepairRejected = status === "repair_rejected" || summary?.repairQuotation?.status === "rejected";
  const isRepairPaid = summary?.repairPayment?.status === "paid" || status === "completed";

  const inspectionFeeAmount = summary?.inspectionFee?.totalAmount || assignment?.inspectionFee?.totalAmount || 2000;
  const inspectionPayment = summary?.inspectionPayment || assignment?.inspectionPayment || {};

  const labour = summary?.repairQuotation?.labourCharge || 0;
  const parts = summary?.repairQuotation?.partsCharge || 0;
  const additionalCharges = summary?.repairQuotation?.additionalCharges || 0;
  const repairBaseTotal = summary?.repairQuotation?.totalAmount || labour + parts + additionalCharges;
  const grandTotal = isRepairRejected ? 0 : repairBaseTotal + tip;

  const completedDate = completion?.completedAt ? new Date(completion.completedAt) : new Date();
  const completedAt = completedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const completedOn = completedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handlePayRepair = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      await payRepairFee(requestId, {
        paymentMethod: payment,
        tip,
      });
      setShowDemoConfirm(false);
      // Reload summary
      const updatedSummary = await getServiceSummary(requestId);
      setSummary(updatedSummary);
    } catch (err) {
      setError(err.message || "Failed to process repair demo payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");
      const result = await submitCustomerReview(requestId, {
        rating,
        comment: review.trim(),
      });
      setReviewRecord(result.review);
      setReviewSuccess(result.message || "Thank you! Review saved successfully.");
    } catch (err) {
      setReviewError(err.message || "Failed to save review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading || !assignment) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading service invoice summary...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="gethelp-page summary-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          <div className="summary-strip">
            <span className="summary-chip green">● Invoice &amp; Settlement</span>
            <span>{draft.location?.address || "Breakdown Location"}</span>
            <strong className="summary-step">
              <ShieldCheck size={13} /> {assignment.requestReference}
            </strong>
          </div>

          <RequestStepper currentStep={6} />

          {/* Banner */}
          <div className="summary-banner">
            <div className="summary-banner-badge">
              <Check size={28} />
            </div>
            <div>
              <h1>
                {isRepairRejected
                  ? "Service Concluded (Quotation Rejected)"
                  : isRepairPaid
                  ? "Service Completed & Fully Settled"
                  : "Repair Finished – Ready for Settlement"}
              </h1>
              <p>
                Request #{assignment.requestReference} · {completedOn} at {completedAt}
              </p>
            </div>
          </div>

          <div className="summary-grid">
            {/* Left Column: Two Invoices (Inspection + Repair) */}
            <div className="summary-left">
              {/* Invoice 1: Inspection Fee */}
              <section className="gethelp-card" style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ReceiptText size={18} color="#15803d" />
                    1. Inspection Fee Invoice
                  </h3>
                  <span style={{ background: "#ecfdf5", color: "#15803d", fontWeight: "bold", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>
                    ✓ PAID (DEMO)
                  </span>
                </div>

                <div className="quotation-box" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span>Travelling Charge:</span>
                    <strong>{formatRs(summary?.inspectionFee?.travelFee || 500)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span>Location Visit Fee:</span>
                    <strong>{formatRs(summary?.inspectionFee?.visitFee || 500)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span>Diagnostic Inspection:</span>
                    <strong>{formatRs(summary?.inspectionFee?.inspectionCharge || 1000)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "14px", fontWeight: "bold" }}>
                    <span>Total Inspection Fee:</span>
                    <span style={{ color: "#15803d" }}>{formatRs(inspectionFeeAmount)}</span>
                  </div>
                  {summary?.inspectionPayment?.transactionId && (
                    <small style={{ display: "block", marginTop: "6px", color: "#64748b", fontSize: "11px" }}>
                      Transaction ID: {summary.inspectionPayment.transactionId}
                    </small>
                  )}
                </div>
              </section>

              {/* Invoice 2: Repair Fee */}
              <section className="gethelp-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Wrench size={18} color="#2563eb" />
                    2. Repair &amp; Parts Invoice
                  </h3>
                  <span
                    style={{
                      background: isRepairRejected ? "#fef2f2" : isRepairPaid ? "#ecfdf5" : "#eff6ff",
                      color: isRepairRejected ? "#dc2626" : isRepairPaid ? "#15803d" : "#2563eb",
                      fontWeight: "bold",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  >
                    {isRepairRejected ? "REJECTED" : isRepairPaid ? "✓ PAID (DEMO)" : "PENDING DEMO PAYMENT"}
                  </span>
                </div>

                {isRepairRejected ? (
                  <div style={{ background: "#fef2f2", padding: "14px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                    <p style={{ margin: 0, color: "#991b1b", fontSize: "13px" }}>
                      You rejected the repair quotation. No repair work was conducted, and no repair charges are due.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="quotation-box" style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                        <span>Labour Charge:</span>
                        <strong>{formatRs(labour)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                        <span>Parts Replacement:</span>
                        <strong>{formatRs(parts)}</strong>
                      </div>
                      {additionalCharges > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                          <span>Additional Charges:</span>
                          <strong>{formatRs(additionalCharges)}</strong>
                        </div>
                      )}
                      {tip > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                          <span>Technician Tip:</span>
                          <strong>{formatRs(tip)}</strong>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "15px", fontWeight: "bold" }}>
                        <span>Total Repair Due:</span>
                        <span style={{ color: "#2563eb" }}>{formatRs(grandTotal)}</span>
                      </div>
                      {summary?.repairPayment?.transactionId && (
                        <small style={{ display: "block", marginTop: "6px", color: "#64748b", fontSize: "11px" }}>
                          Transaction ID: {summary.repairPayment.transactionId}
                        </small>
                      )}
                    </div>

                    {!isRepairPaid && (
                      <div>
                        {/* Demo Payment method selection */}
                        <strong style={{ display: "block", fontSize: "13px", marginBottom: "8px", color: "#334155" }}>
                          Select Demo Payment Method:
                        </strong>
                        <div className="settlement-chips" style={{ marginBottom: "14px" }}>
                          {paymentMethods.map((m) => (
                            <span
                              key={m.id}
                              onClick={() => setPayment(m.id)}
                              style={{
                                cursor: "pointer",
                                border: payment === m.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                                background: payment === m.id ? "#eff6ff" : "#fff",
                                fontWeight: payment === m.id ? "bold" : "normal",
                              }}
                            >
                              <m.icon size={14} /> {m.name}
                            </span>
                          ))}
                        </div>

                        {/* Optional tip */}
                        <div style={{ marginBottom: "16px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                            Add Mechanic Tip (Demo):
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {tipOptions.map((t) => (
                              <button
                                key={t}
                                type="button"
                                className={`gh-back-button ${tip === t ? "active" : ""}`}
                                style={{ padding: "6px 12px", fontSize: "12px", border: tip === t ? "2px solid #2563eb" : "" }}
                                onClick={() => setTip(t)}
                              >
                                {t === 0 ? "No Tip" : `+${formatRs(t)}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {error && <p className="form-error" role="alert" style={{ marginBottom: "12px" }}>{error}</p>}

                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px" }}
                          onClick={() => setShowDemoConfirm(true)}
                          disabled={paymentLoading}
                        >
                          Confirm Final Repair Demo Payment - {formatRs(grandTotal)}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Rating & Review */}
            <div className="summary-right">
              {/* Review card */}
              <section className="gethelp-card">
                <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Star size={18} color="#f59e0b" /> Rate Mechanic Experience
                </h3>

                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
                  How satisfied are you with {mechanic.name || "the technician"}'s service?
                </p>

                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                      onClick={() => setRating(star)}
                      disabled={Boolean(reviewRecord)}
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        size={28}
                        fill={star <= rating ? "#f59e0b" : "#e2e8f0"}
                        color={star <= rating ? "#f59e0b" : "#cbd5e1"}
                      />
                    </button>
                  ))}
                </div>
                <small style={{ color: "#f59e0b", fontWeight: "bold", display: "block", marginBottom: "12px" }}>
                  {ratingWords[rating]}
                </small>

                <textarea
                  rows="3"
                  aria-label="Written review (optional)"
                  placeholder="Written review (optional)"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  disabled={Boolean(reviewRecord)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", marginBottom: "10px" }}
                />

                {reviewError && <p className="form-error" role="alert" style={{ fontSize: "12px" }}>{reviewError}</p>}
                {reviewSuccess && <p className="done-green" style={{ fontSize: "12px", color: "#15803d" }}>✓ {reviewSuccess}</p>}

                <button
                  type="button"
                  className="gh-next-button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || Boolean(reviewRecord)}
                >
                  {reviewSubmitting
                    ? "Submitting..."
                    : reviewRecord
                      ? "Review Submitted"
                      : "Submit Rating"}
                </button>
              </section>

              {/* Print Receipt Button */}
              <div style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="gh-back-button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleDownload}
                >
                  <Download size={16} /> Print / Save PDF Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Payment Modal Confirmation */}
      {showDemoConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(10, 20, 40, 0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "#e0f2fe",
                color: "#0284c7",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <CreditCard size={28} />
            </div>

            <h3 style={{ fontSize: "20px", margin: "0 0 8px", color: "#0f172a" }}>
              DEMO REPAIR PAYMENT
            </h3>

            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px", lineHeight: "1.5" }}>
              This is a <strong>DEMO payment simulation</strong>. <strong>No real money</strong> is charged.
            </p>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "10px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "20px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Repair Fee:</span>
                <strong>{formatRs(repairBaseTotal)}</strong>
              </div>
              {tip > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Tip:</span>
                  <strong>{formatRs(tip)}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Method:</span>
                <strong style={{ textTransform: "capitalize" }}>Demo {payment}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "15px" }}>
                <strong>Total Demo Charge:</strong>
                <strong style={{ color: "#0284c7" }}>{formatRs(grandTotal)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="gh-back-button"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setShowDemoConfirm(false)}
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gh-next-button"
                style={{ flex: 2, justifyContent: "center" }}
                onClick={handlePayRepair}
                disabled={paymentLoading}
              >
                {paymentLoading ? "Processing..." : "Confirm Demo Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Summary;
