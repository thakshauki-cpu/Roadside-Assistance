import mongoose from "mongoose";

const mechanicProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    services: {
      type: [String],
      required: true,
      enum: [
        "Tyre Repair",
        "Battery Jumpstart",
        "Engine Breakdown",
        "Fuel Delivery",
        "Towing",
        "General Repair",
      ],
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MechanicProfile = mongoose.model(
  "MechanicProfile",
  mechanicProfileSchema
);

export default MechanicProfile;