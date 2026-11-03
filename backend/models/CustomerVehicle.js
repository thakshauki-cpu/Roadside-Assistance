import mongoose from "mongoose";

const customerVehicleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["Car", "Bike", "Van", "Three Wheeler", "Truck"],
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 32,
    },
    vehicleNumberNormalized: {
      type: String,
      required: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

customerVehicleSchema.index(
  { customer: 1, vehicleNumberNormalized: 1 },
  { unique: true }
);

const CustomerVehicle = mongoose.model(
  "CustomerVehicle",
  customerVehicleSchema
);

export default CustomerVehicle;
