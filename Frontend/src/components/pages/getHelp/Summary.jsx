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

const mechanicFiles = import.meta.glob("../../../assets/mechanic-siva.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mechanicImage = Object.values(mechanicFiles)[0];

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

  const handleCustomTip = (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    setTip(digits === "" ? 0 : Number(digits));
  };

  const handleDownload = () => window.print();

  const handlePayRepair = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      await payRepairFee(requestId, {
        paymentMethod: payment,
        tip,
      });
      setShowDemoConfirm(false);
      // Reload updated summary
      const updatedSummary = await getServiceSummary(requestId);
      setSummary(updatedSummary);
    } catch (paymentError) {
      setError(paymentError.message || "Failed to process repair demo payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!review.trim()) {
      setReviewError("Please write a review before submitting.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      setReviewSuccess("");
      const result = await submitCustomerReview(requestId, { rating, comment: review });
      setReviewRecord(result.review);
      setReviewSuccess(result.message);
    } catch (submitError) {
      setReviewError(submitError.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isCustomTip = customOpen || !tipOptions.includes(tip);

  if (loading || !completion || !assignment) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading service completion details...</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="gethelp-page">
      <DashboardSidebar activeItem="My Requests" />

      <main className="gethelp-main">
        <DashboardTopbar />

        <div className="gethelp-content">
          <RequestStepper currentStep={6} />

          {/* Banner */}
          <section className="done-banner">
            <span className="done-check-outer">
              <span className="done-check-inner">
                <Check size={30} />
              </span>
            </span>

            <div>
              <span className="done-pill">
                ● {isRepairRejected ? "Inspection Concluded" : isRepairPaid ? "Service & Payment Completed" : "Repair Finished – Ready for Settlement"}
              </span>
              <h1>
                {isRepairRejected
                  ? "Service Concluded (Inspection Only)"
                  : isRepairPaid
                  ? "Roadside Rescue Completed & Settled!"
                  : "Vehicle Repair Completed"}
              </h1>
              <p>
                Service ID: <strong>#{summary?.requestReference || assignment?.requestReference}</strong> • Breakdown Location:{" "}
                {summary?.location?.address || draft.location?.address || "Batticaloa"}
              </p>
            </div>
          </section>

          {error && <p className="form-error" role="alert" style={{ marginBottom: "16px" }}>{error}</p>}

          <div className="done-grid">
            {/* ===== Left column: Two Separate Payment Sections ===== */}
            <div className="done-left">
              {/* Payment 1: Inspection Fee (Separate Record) */}
              <section className="gethelp-card done-card">
                <div className="done-card-head">
                  <h2>
                    <FileCheck size={18} /> 1. Inspection Payment Record
                  </h2>
                  <span className="done-badge-ok">
                    ✓ Paid ({inspectionPayment.paymentType || "Demo"})
                  </span>
                </div>

                <div className="done-invoice-table">
                  <div className="done-row">
                    <span>Travelling &amp; Visit Charge</span>
                    <b>Rs. {Number((summary?.inspectionFee?.travelFee || 0) + (summary?.inspectionFee?.visitFee || 0) || 1000).toLocaleString()}</b>
                  </div>
                  <div className="done-row">
                    <span>On-Site Vehicle Diagnosis</span>
                    <b>Rs. {Number(summary?.inspectionFee?.inspectionCharge || 1000).toLocaleString()}</b>
                  </div>
                  <hr />
                  <div className="done-row done-row-total">
                    <div>
                      <strong>Inspection Fee Total</strong>
                      <small>Demo TX: {inspectionPayment.transactionId || "DEMO-INSP-CONFIRMED"}</small>
                    </div>
                    <span>{formatRs(inspectionFeeAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Payment 2: Repair Fee */}
              <section className="gethelp-card done-card">
                <div className="done-card-head">
                  <h2>
                    <ReceiptText size={18} /> 2. Final Repair Fee
                  </h2>
                  <span className={isRepairRejected ? "done-badge-pending" : isRepairPaid ? "done-badge-ok" : "done-badge-pending"}>
                    {isRepairRejected
                      ? "Quotation Rejected (Rs. 0)"
                      : isRepairPaid
                      ? "✓ Settle Complete"
                      : "Payment Pending"}
                  </span>
                </div>

                {isRepairRejected ? (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", marginTop: "12px" }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                      You rejected the repair quotation. No repair fee is payable. You were only charged the initial inspection fee above.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="done-invoice-table">
                      <div className="done-row">
                        <div>
                          <span>Labour Charge</span>
                          <small>{summary?.repairQuotation?.description || "Diagnostic repair & labour"}</small>
                        </div>
                        <b>{formatRs(labour)}</b>
                      </div>
                      <div className="done-row">
                        <span>Spare Parts &amp; Consumables</span>
                        <b>{formatRs(parts)}</b>
                      </div>
                      {additionalCharges > 0 && (
                        <div className="done-row">
                          <span>Additional Charges</span>
                          <b>{formatRs(additionalCharges)}</b>
                        </div>
                      )}
                      {!isRepairPaid && (
                        <div className="done-row" style={{ alignItems: "center" }}>
                          <span>Add Tip for {mechanic.name || "Mechanic"}</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {tipOptions.map((amount) => (
                              <button
                                key={amount}
                                type="button"
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: tip === amount ? "2px solid #1453ff" : "1px solid #cbd5e1",
                                  background: tip === amount ? "#eff4ff" : "#fff",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                                onClick={() => setTip(amount)}
                              >
                                {amount === 0 ? "No Tip" : `+${amount}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {tip > 0 && (
                        <div className="done-row">
                          <span>Driver Tip</span>
                          <b>{formatRs(tip)}</b>
                        </div>
                      )}
                      <hr />
                      <div className="done-row done-row-total">
                        <div>
                          <strong>Repair Settlement Total</strong>
                          <small>
                            {isRepairPaid
                              ? `Demo TX: ${summary?.repairPayment?.transactionId || "DEMO-REP-CONFIRMED"}`
                              : "Payable after repair completion"}
                          </small>
                        </div>
                        <span>{formatRs(grandTotal)}</span>
                      </div>
                    </div>

                    {!isRepairPaid && (
                      <div style={{ marginTop: "18px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1e293b" }}>
                          Select Demo Settlement Method:
                        </label>
                        <div className="done-pay-grid">
                          {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                              <label key={method.id} className={"done-pay " + (payment === method.id ? "selected" : "")}>
                                <span className="done-pay-top">
                                  <Icon size={20} />
                                  <input
                                    type="radio"
                                    name="payment"
                                    value={method.id}
                                    checked={payment === method.id}
                                    onChange={() => setPayment(method.id)}
                                  />
                                </span>
                                <strong>{method.name}</strong>
                                <small>{method.text}</small>
                              </label>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="gh-next-button"
                          style={{ width: "100%", justifyContent: "center", marginTop: "16px", padding: "14px" }}
                          onClick={() => setShowDemoConfirm(true)}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? "Processing Demo Payment..." : `Confirm Repair Demo Payment (${formatRs(grandTotal)})`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* ===== Right column: Rating & Reviews ===== */}
            <div className="done-right">
              <section className="gethelp-card done-card">
                <h2 className="done-rate-title">
                  <MessageSquareQuote size={18} /> Rate Your Experience
                </h2>
                <p className="done-help done-help-tight">How was {mechanic.name || "the mechanic"}'s roadside assistance?</p>

                <div className="done-snapshot">
                  {mechanicImage ? (
                    <img className="done-photo done-photo-small" src={mechanicImage} alt={mechanic.name} />
                  ) : (
                    <span className="done-photo done-photo-small done-photo-missing">
                      {(mechanic.name || "M").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <strong>{mechanic.name || "Mechanic"}</strong>
                    <p>
                      <span className="done-green">Completed</span> • {completion?.problemTitle || "Roadside Rescue"}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="done-rating-box">
                  <small>Tap to rate mechanic</small>
                  <div className="done-star-row">
                    {[1, 2, 3, 4, 5].map((number) => (
                      <button
                        key={number}
                        type="button"
                        className={"done-star-btn " + (rating >= number ? "filled" : "")}
                        onClick={() => setRating(number)}
                        aria-label={`${number} star`}
                      >
                        <Star size={24} fill={rating >= number ? "#f5a524" : "none"} color={rating >= number ? "#f5a524" : "#cbd5e1"} />
                      </button>
                    ))}
                  </div>
                  <b>{ratingWords[rating]}</b>
                </div>

                <div className="done-feedback-box">
                  <textarea
                    rows={3}
                    placeholder="Leave a public roadside review..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                  {reviewError && <p className="form-error" role="alert">{reviewError}</p>}
                  {reviewSuccess && <p className="done-green" style={{ fontSize: "12px", marginTop: "4px" }}>✓ {reviewSuccess}</p>}
                  <button
                    type="button"
                    className="gh-next-button"
                    style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting..." : reviewRecord ? "Update Review" : "Submit Review"}
                  </button>
                </div>
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
