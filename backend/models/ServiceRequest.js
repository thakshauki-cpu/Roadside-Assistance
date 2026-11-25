import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    // Customer who creates the request
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Vehicle related to this request
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    // Breakdown location
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      landmark: {
        type: String,
        trim: true,
        default: "",
      },
      details: {
        type: String,
        trim: true,
        default: "",
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (coordinates) =>
            coordinates === undefined ||
            (coordinates.length === 2 &&
              coordinates.every(Number.isFinite) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90),
          message: "Location coordinates must contain longitude and latitude.",
        },
      },
    },

    // Problem details
    problem: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Overall request workflow status
    status: {
      type: String,
      enum: [
        "pending",
        "searching",
        "assigned",
        "accepted",
        "inspection_fee_submitted",
        "inspection_paid",
        "on_the_way",
        "arrived",
        "inspecting",
        "inspection_completed",
        "quotation_submitted",
        "repair_in_progress",
        "repair_rejected",
        "repair_completed",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Assigned mechanic
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Step 2: Separate inspection fee submitted by mechanic
    inspectionFee: {
      travelFee: { type: Number, default: 0, min: 0 },
      visitFee: { type: Number, default: 0, min: 0 },
      inspectionCharge: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 },
      description: { type: String, default: "" },
      status: {
        type: String,
        enum: ["pending", "submitted", "paid"],
        default: "pending",
      },
      submittedAt: { type: Date, default: null },
    },

    // Step 3: Customer inspection fee demo payment
    inspectionPayment: {
      amount: { type: Number, default: 0 },
      paymentType: { type: String, default: "demo" },
      paymentMethod: { type: String, default: "card" },
      status: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid",
      },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    // Progress milestone timestamps
    dispatchedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    inspectionStartedAt: { type: Date, default: null },
    inspectionCompletedAt: { type: Date, default: null },

    // Step 8: Separate repair quotation submitted by mechanic
    repairQuotation: {
      labourCharge: { type: Number, default: 0, min: 0 },
      partsCharge: { type: Number, default: 0, min: 0 },
      additionalCharges: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 },
      description: { type: String, default: "" },
      status: {
        type: String,
        enum: ["pending", "submitted", "accepted", "rejected"],
        default: "pending",
      },
      submittedAt: { type: Date, default: null },
      respondedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: "" },
    },

    // Step 9 & 10: Repair progress timestamps
    repairStartedAt: { type: Date, default: null },
    repairCompletedAt: { type: Date, default: null },

    // Step 11: Final repair fee demo payment
    repairPayment: {
      amount: { type: Number, default: 0 },
      tip: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      paymentType: { type: String, default: "demo" },
      paymentMethod: { type: String, default: "card" },
      status: {
        type: String,
        enum: ["unpaid", "paid", "not_applicable"],
        default: "unpaid",
      },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    completedAt: {
      type: Date,
      default: null,
    },

    rejectedMechanics: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ServiceRequest = mongoose.model(
  "ServiceRequest",
  serviceRequestSchema
);

export default ServiceRequest;
