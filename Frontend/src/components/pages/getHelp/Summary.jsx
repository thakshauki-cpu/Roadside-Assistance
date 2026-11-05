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
  submitMockPayment,
} from "../../../api/getHelp";
import {
  formatRs,
  getCreatedRequestId,
  readCreatedRequest,
  readRequest,
} from "./requestSampleData";
import "../../styles/GetHelp.css";
import "../../styles/Summary.css";

// Optional mechanic photo (same file as the Tracking page, see the notes)
const mechanicFiles = import.meta.glob("../../../assets/mechanic-siva.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mechanicImage = Object.values(mechanicFiles)[0];

const paymentMethods = [
  { id: "cash", name: "Cash", text: "Hand over cash on-site", icon: Banknote },
  { id: "card", name: "Card POS", text: "Visa / Mastercard / LankaPay", icon: CreditCard },
  { id: "qr", name: "QR / Digital", text: "FriMi, Koko, Genie & LANKAQR", icon: QrCode },
];

// Words shown under the stars
const ratingWords = ["", "Poor", "Fair", "Good", "Very Good", "Exceptional Service"];

// Tip buttons (0 means "No Tip")
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

  // Things the customer can change on this page
  const [payment, setPayment] = useState("cash");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [tip, setTip] = useState(200); // change 200 to 0 for "No Tip" at the start
  const [customOpen, setCustomOpen] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [reviewRecord, setReviewRecord] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const loadSettlementData = async () => {
      try {
        if (!requestId) {
          throw new Error("Your service request is missing. Please submit it again.");
        }
        const [assignmentData, completionData, reviewData] = await Promise.all([
          getAssignment(requestId),
          getCompletion(requestId),
          getCustomerReview(requestId),
        ]);
        if (active) {
          setAssignment(assignmentData);
          setCompletion(completionData.completion);
          if (reviewData.review) {
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

  const mechanic =
    summary?.mechanic || completion?.mechanic || assignment?.mechanic;
  const quotation = summary?.quotation || assignment?.quotation;
  const issueName = summary?.problem || createdRequest.problem || "Service request";
  const issueTitle = completion?.problemTitle || issueName;
  const issueWork = completion?.workCompleted || "";
  const description =
    summary?.description || createdRequest.description || "";
  const vehicleData = summary?.vehicle || draft.vehicle || {};
  const vehicleLabel = vehicleData.registrationNumber
    ? `${vehicleData.model || vehicleData.vehicleType} (${vehicleData.registrationNumber})`
    : vehicleData.model || vehicleData.vehicleType || "Vehicle";
  const place =
    summary?.location?.address ||
    createdRequest.location?.address ||
    draft.location?.address ||
    "Location";
  const labour = quotation?.labour || 0;
  const parts = quotation?.parts || 0;
  const additionalCharges = quotation?.additionalCharges || 0;
  const serviceTotal = quotation?.total || labour + parts + additionalCharges;
  const completedDate = completion?.completedAt
    ? new Date(completion.completedAt)
    : null;
  const completedAt = completedDate
    ? completedDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  const completedOn = completedDate
    ? completedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const grandTotal = summary?.payment?.amount || serviceTotal + tip;

  // Typing a custom tip: keep digits only
  const handleCustomTip = (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    setTip(digits === "" ? 0 : Number(digits));
  };

  // The browser print window lets the user save the page as a PDF
  const handleDownload = () => window.print();

  const loadSummary = async () => {
    try {
      setError("");
      const summaryData = await getServiceSummary(requestId);
      setSummary(summaryData);
    } catch (summaryError) {
      setError(`Payment is confirmed, but the service summary could not load: ${summaryError.message}`);
    }
  };

  const handlePay = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      await submitMockPayment(requestId, {
        paymentMethod: payment,
        tip,
      });
      setPaymentSubmitted(true);
      await loadSummary();
    } catch (paymentError) {
      setError(paymentError.message);
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

  if (loading || !completion || !assignment || !mechanic || !quotation) {
    return (
      <div className="gethelp-page">
        <DashboardSidebar activeItem="My Requests" />
        <main className="gethelp-main">
          <DashboardTopbar />
          <div className="gethelp-content">
            {error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : (
              <p role="status">Loading service completion and quotation...</p>
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

          {/* Success banner */}
          <section className="done-banner">
            <span className="done-check-outer">
              <span className="done-check-inner">
                <Check size={30} />
              </span>
            </span>

            <div>
              <div className="done-title-row">
                <h1>Service Completed</h1>
                <span className="done-verified">
                  <span className="done-verified-dot" /> {completion.status}
                </span>
              </div>
              <p className="done-text">
                <strong>{mechanic.name}</strong> has completed your roadside repair successfully on {place}.
              </p>
              <p className="done-meta">
                <Clock size={13} /> Completed {completedOn}, {completedAt} <span>•</span> Response Time: {completion.responseTimeMinutes} mins <span>•</span>{" "}
                {mechanic.depot}
              </p>
            </div>
          </section>

          <div className="done-grid">
            {/* ===== Left column ===== */}
            <div className="done-left">
              {/* Job summary */}
              <section className="gethelp-card done-card">
                <div className="done-card-head">
                  <h2>
                    <ClipboardList size={18} /> Job &amp; Service Summary
                  </h2>
                  <span className="done-invoice">
                    {summary?.requestReference || completion.requestReference}
                  </span>
                </div>

                <div className="done-two">
                  <div className="done-tile">
                    <small>Reported Problem</small>
                    <div className="done-tile-row">
                      <CircleDot size={18} className="done-red" />
                      <div>
                        <strong>{completion.problemTitle || issueTitle}</strong>
                        <p>{issueWork}</p>
                        {description && <p>{description}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="done-tile">
                    <small>Vehicle &amp; Location</small>
                    <div className="done-tile-row">
                      <CarFront size={18} className="done-blue" />
                      <div>
                        <strong>{vehicleLabel}</strong>
                        <p>{place}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mechanic row */}
                <div className="done-mechanic">
                  <div className="done-mechanic-left">
                    {mechanicImage ? (
                      <img className="done-photo" src={mechanicImage} alt={mechanic.name} />
                    ) : (
                      <span className="done-photo done-photo-missing">
                        {mechanic.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <strong>
                        {mechanic.name} <BadgeCheck size={16} className="done-green" />
                      </strong>
                      <p>{mechanic.depot}</p>
                      <span className="done-stars">
                        <Star size={12} fill="currentColor" /> <b>{mechanic.rating}</b> ({mechanic.rescues} roadside jobs)
                      </span>
                    </div>
                  </div>

                  <div className="done-mechanic-right">
                    <span className="done-dispatch">On-Site Dispatch</span>
                    <small>{mechanic.unit}</small>
                  </div>
                </div>

                {/* Price lines */}
                <div className="done-prices">
                  <div>
                  <span>Labour</span>
                    <b>{formatRs(labour)}</b>
                  </div>
                  <div>
                  <span>Parts &amp; Materials</span>
                    <b>{formatRs(parts)}</b>
                  </div>
                {additionalCharges > 0 && (
                  <div className="done-small">
                    <span>Additional Charges</span>
                    <b>{formatRs(additionalCharges)}</b>
                  </div>
                )}
                <div className="done-small">
                  <span>Service Estimate</span>
                  <b className="done-green">{quotation.estimatedServiceMinutes} mins</b>
                  </div>
                  {tip > 0 && (
                    <div className="done-small">
                      <span>Tip for {mechanic.name.split(" ")[0]}</span>
                      <b>{formatRs(tip)}</b>
                    </div>
                  )}
                  <hr />
                  <div className="done-total">
                    <div>
                      <strong>Total Amount Due</strong>
                      <small>Mock quotation total plus selected tip</small>
                    </div>
                    <span>{formatRs(grandTotal)}</span>
                  </div>
                </div>
              </section>

              {/* Payment method */}
              <section className="gethelp-card done-card">
                <div className="done-card-head done-card-head-plain">
                  <h2>
                    <CreditCard size={18} /> Select Payment Method
                  </h2>
                  <span className="done-zero">
                    {additionalCharges > 0
                      ? `${formatRs(additionalCharges)} additional charges`
                      : "No additional charges"}
                  </span>
                </div>

                <p className="done-help">
                  Choose how you wish to settle this repair directly with {mechanic.name}. This mock payment provides an instant
                  verified digital tax receipt.
                </p>

                <div className="done-pay-grid">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label key={method.id} className={"done-pay " + (payment === method.id ? "selected" : "")}>
                        <span className="done-pay-top">
                          <Icon size={22} />
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

                <p className="done-secure">
                  <ShieldCheck size={14} /> Mock settlement • Request {summary?.requestReference || completion.requestReference}
                </p>
                {summary?.payment && (
                  <p className="done-secure" role="status">
                    Mock payment {summary.payment.status} by {summary.payment.method.toUpperCase()}.
                    Confirmation: {summary.payment.confirmationCode}
                  </p>
                )}
              </section>
            </div>

            {/* ===== Right column: rating ===== */}
            <div className="done-right">
              <section className="gethelp-card done-card">
                <h2 className="done-rate-title">
                  <MessageSquareQuote size={18} /> Rate Your Experience
                </h2>
                <p className="done-help done-help-tight">How was {mechanic.name}'s service today?</p>

                <div className="done-snapshot">
                  {mechanicImage ? (
                    <img className="done-photo done-photo-small" src={mechanicImage} alt={mechanic.name} />
                  ) : (
                    <span className="done-photo done-photo-small done-photo-missing">
                      {mechanic.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <strong>{mechanic.name}</strong>
                    <p>
                      <span className="done-green">Arrived in {completion.responseTimeMinutes} mins</span> • {completion.problemTitle}
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
                        aria-label={number + " star" + (number > 1 ? "s" : "")}
                        className={number <= rating ? "on" : ""}
                        onClick={() => setRating(number)}
                        disabled={Boolean(reviewRecord)}
                      >
                        <Star size={28} fill={number <= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <strong>
                    {rating.toFixed(1)} • {ratingWords[rating]}
                  </strong>
                </div>

                {/* Review */}
                <label className="done-label" htmlFor="review">
                  Written review for {mechanic.name}
                </label>
                <textarea
                  id="review"
                  className="done-textarea"
                  placeholder="e.g. Arrived quickly and repaired the tyre neatly."
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                  maxLength={1000}
                  disabled={Boolean(reviewRecord)}
                />
                {!reviewRecord && (
                  <button
                    type="button"
                    className="gh-next-button done-review-submit"
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting review..." : "Submit Review"}
                  </button>
                )}
                {reviewSuccess && <p className="done-review-success" role="status">{reviewSuccess}</p>}
                {reviewRecord && !reviewSuccess && (
                  <p className="done-review-success" role="status">You have already reviewed this completed service.</p>
                )}
                {reviewError && <p className="form-error" role="alert">{reviewError}</p>}

                {/* Tip */}
                <div className="done-tip-top">
                  <span className="done-label">Add a tip for {mechanic.name} (Optional)</span>
                  <span className="done-green">100% goes to mechanic</span>
                </div>
                <div className="done-tip-row">
                  {tipOptions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={tip === amount && !customOpen ? "on" : ""}
                      onClick={() => {
                        setTip(amount);
                        setCustomOpen(false);
                      }}
                    >
                      {amount === 0 ? "No Tip" : "+Rs. " + amount}
                    </button>
                  ))}
                  <button type="button" className={isCustomTip ? "on" : ""} onClick={() => setCustomOpen(true)}>
                    Custom
                  </button>
                </div>

                {customOpen && (
                  <input
                    className="done-custom-tip"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter tip amount (Rs.)"
                    value={tip === 0 ? "" : tip}
                    onChange={handleCustomTip}
                  />
                )}
              </section>
            </div>
          </div>

          {/* Settlement bar */}
          <section className="done-bar">
            <div className="done-bar-left">
              <span className="done-bar-icon">
                <ReceiptText size={20} />
              </span>
              <div>
                <strong>Settlement Ready</strong>
                <p>A mock payment confirmation will be generated for this demo request.</p>
              </div>
            </div>

            <div className="done-bar-right">
              <button type="button" className="done-download" onClick={handleDownload}>
                <Download size={14} /> Download Invoice PDF
              </button>
              <button
                type="button"
                className="gh-next-button"
                onClick={handlePay}
                disabled={paymentSubmitted || paymentLoading}
              >
                <Check size={16} />
                {paymentLoading
                  ? "Processing mock payment..."
                  : paymentSubmitted
                  ? "Payment Confirmed"
                  : "Pay & Submit (" + formatRs(grandTotal) + ")"}
              </button>
              {paymentSubmitted && !summary && (
                <button
                  type="button"
                  className="done-download"
                  onClick={loadSummary}
                >
                  Retry loading summary
                </button>
              )}
            </div>
          </section>

          {error && <p className="form-error" role="alert">{error}</p>}

          <p className="done-footnote">
            <Headset size={15} /> Need help with this bill or experienced an issue?{" "}
            <a href="tel:0652223333">Contact Batticaloa SOS Desk at 065-222-3333</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Summary;