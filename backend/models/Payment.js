import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // inspection or repair
    paymentType: {
      type: String,
      enum: ["inspection", "repair"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Demo payment method chosen by the customer (cash, card, qr)
    paymentMethod: {
      type: String,
      default: "card",
    },

    status: {
      type: String,
      enum: ["paid", "refunded"],
      default: "paid",
    },

    isDemo: {
      type: Boolean,
      default: true,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payment records of the same paymentType for the same serviceRequest
paymentSchema.index(
  { serviceRequest: 1, paymentType: 1 },
  { unique: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
