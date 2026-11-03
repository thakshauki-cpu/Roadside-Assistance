
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

    // Request status
    status: {
      type: String,
      enum: [
        "pending",
        "searching",
        "assigned",
        "accepted",
        "on_the_way",
        "in_progress",
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
