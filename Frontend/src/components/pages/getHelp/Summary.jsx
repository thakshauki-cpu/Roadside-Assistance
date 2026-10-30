import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { mechanic, issueDetails, defaultPrices, formatRs, timeText, readRequest } from "./requestSampleData";
import "../../styles/GetHelp.css";
import "../../styles/Summary.css";

// Optional mechanic photo (same file as the Tracking page, see the notes)
const mechanicFiles = import.meta.glob("../../../assets/mechanic-siva.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const mechanicImage = Object.values(mechanicFiles)[0];

// The 3 payment choices
const paymentMethods = [
  { id: "cash", name: "Cash", text: "Handover cash to Siva on-site", icon: Banknote },
  { id: "card", name: "Card POS", text: "Visa / Mastercard / LankaPay", icon: CreditCard },
  { id: "qr", name: "QR / Digital", text: "FriMi, Koko, Genie & LANKAQR", icon: QrCode },
];

// Quick feedback tags
const feedbackTags = ["Prompt Arrival", "Polite & Professional", "Fair Pricing", "Quick Fix", "Clean Work"];

// Words shown under the stars
const ratingWords = ["", "Poor", "Fair", "Good", "Very Good", "Exceptional Service"];

// Tip buttons (0 means "No Tip")
const tipOptions = [0, 200, 500];

function Summary() {
  const navigate = useNavigate();

  // Data saved by the earlier steps (with sample values if something is missing)
  const saved = readRequest();
  const issue = issueDetails[saved.issue] || issueDetails.Puncture;
  const plate = saved.plate || "EP CAB 1234";
  const vehicle = (saved.model ? saved.model.split(" - ")[0] : "Toyota Axio") + " (" + plate + ")";
  const place = saved.landmark || "Kallady Bridge, Batticaloa";

  // Price lines. The Quotation step saved one total, so we split it like the quotation did.
  const labour = saved.total ? Math.min(defaultPrices.labour, saved.total) : defaultPrices.labour;
  const parts = saved.total ? saved.total - labour : defaultPrices.parts;

  // Things the customer can change on this page
  const [payment, setPayment] = useState("cash");
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState(["Prompt Arrival", "Polite & Professional"]);
  const [review, setReview] = useState("");
  const [tip, setTip] = useState(200); // change 200 to 0 for "No Tip" at the start
  const [customOpen, setCustomOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Time of completion is fixed while the page is open
  const [completedAt] = useState(() => timeText(0));

  const serviceTotal = labour + parts;
  const grandTotal = serviceTotal + tip;

  // Add the tag if it is not selected, remove it if it is
  const toggleTag = (tag) => {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  };

  // Typing a custom tip: keep digits only
  const handleCustomTip = (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    setTip(digits === "" ? 0 : Number(digits));
  };

  // The browser print window lets the user save the page as a PDF
  const handleDownload = () => window.print();

  const handlePay = () => {
    const updated = {
      ...saved,
      paymentMethod: payment,
      rating: rating,
      feedbackTags: tags,
      review: review,
      tip: tip,
      totalPaid: grandTotal,
      completedAt: completedAt,
    };
    localStorage.setItem("serviceRequest", JSON.stringify(updated));
    setSubmitted(true);

    // Show the thank you message for a moment, then go to the dashboard
    setTimeout(() => {
      localStorage.removeItem("serviceRequest"); // so the next request starts fresh
      navigate("/dashboard");
    }, 1800);
  };

  const isCustomTip = customOpen || !tipOptions.includes(tip);

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
                  <span className="done-verified-dot" /> Resolution Verified
                </span>
              </div>
              <p className="done-text">
                <strong>{mechanic.name}</strong> has completed your roadside repair successfully on {place}.
              </p>
              <p className="done-meta">
                <Clock size={13} /> Completed Today, {completedAt} <span>•</span> Response Time: 9 mins <span>•</span>{" "}
                Batticaloa Operational Base
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
                  <span className="done-invoice">LK-9021</span>
                </div>

                <div className="done-two">
                  <div className="done-tile">
                    <small>Reported Problem</small>
                    <div className="done-tile-row">
                      <CircleDot size={18} className="done-red" />
                      <div>
                        <strong>{issue.title}</strong>
                        <p>{issue.work}</p>
                      </div>
                    </div>
                  </div>

                  <div className="done-tile">
                    <small>Vehicle &amp; Location</small>
                    <div className="done-tile-row">
                      <CarFront size={18} className="done-blue" />
                      <div>
                        <strong>{vehicle}</strong>
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
                      <span className="done-photo done-photo-missing" title="Add src/assets/mechanic-siva.png">
                        SA
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
                    <span>Labour, Jacking &amp; Safety Inspection</span>
                    <b>{formatRs(labour)}</b>
                  </div>
                  <div>
                    <span>High-Grade Parts &amp; Materials</span>
                    <b>{formatRs(parts)}</b>
                  </div>
                  <div className="done-small">
                    <span>Emergency Dispatch Surcharge (Batticaloa Municipality)</span>
                    <b className="done-green">Rs. 0 (Waived)</b>
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
                      <small>Includes all municipal field taxes</small>
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
                  <span className="done-zero">Zero Surcharge</span>
                </div>

                <p className="done-help">
                  Choose how you wish to settle this repair directly with Siva. All payments provide an instant
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
                  <ShieldCheck size={14} /> 100% Secure Roadside Settlement • RoadMate Invoice #LK-9021 verified
                  &amp; archived
                </p>
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
                    <span className="done-photo done-photo-small done-photo-missing">SA</span>
                  )}
                  <div>
                    <strong>{mechanic.name}</strong>
                    <p>
                      <span className="done-green">Arrived in 9 mins</span> • Puncture Specialist
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
                      >
                        <Star size={28} fill={number <= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <strong>
                    {rating.toFixed(1)} • {ratingWords[rating]}
                  </strong>
                </div>

                {/* Tags */}
                <p className="done-label">What went well? (Select all that apply)</p>
                <div className="done-tags">
                  {feedbackTags.map((tag) => {
                    const on = tags.includes(tag);
                    return (
                      <button key={tag} type="button" className={on ? "on" : ""} onClick={() => toggleTag(tag)}>
                        {on && "✓ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Review */}
                <label className="done-label" htmlFor="review">
                  Message or Review for Siva
                </label>
                <textarea
                  id="review"
                  className="done-textarea"
                  placeholder="e.g. Arrived quickly and repaired the tyre neatly."
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                />

                {/* Tip */}
                <div className="done-tip-top">
                  <span className="done-label">Add a tip for Siva (Optional)</span>
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
                <p>Tax receipt will be sent automatically to your registered phone &amp; email.</p>
              </div>
            </div>

            <div className="done-bar-right">
              <button type="button" className="done-download" onClick={handleDownload}>
                <Download size={14} /> Download Invoice PDF
              </button>
              <button type="button" className="gh-next-button" onClick={handlePay} disabled={submitted}>
                <Check size={16} />
                {submitted ? "Submitted. Thank you!" : "Pay & Submit (" + formatRs(grandTotal) + ")"}
              </button>
            </div>
          </section>

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