import mongoose from "mongoose";
import User from "../models/User.js";
import CustomerVehicle from "../models/CustomerVehicle.js";

const customerFields = "fullName email mobile location preferredLanguage role";
const allowedVehicleTypes = [
  "Car",
  "Bike",
  "Van",
  "Three Wheeler",
  "Truck",
];

const getCustomer = async (req, res) => {
  const customer = await User.findById(req.user).select(customerFields);
  if (!customer || customer.role !== "customer") {
    res.status(404).json({
      success: false,
      message: "Customer not found.",
    });
    return null;
  }

  return customer;
};

const serializeVehicle = (vehicle) => ({
  id: vehicle.id,
  vehicleType: vehicle.vehicleType,
  vehicleModel: vehicle.vehicleModel,
  vehicleNumber: vehicle.vehicleNumber,
});

const normalizeVehicleNumber = (vehicleNumber) =>
  vehicleNumber.replace(/\s+/g, "").toUpperCase();

export const getProfile = async (req, res) => {
  try {
    const customer = await getCustomer(req, res);
    if (!customer) return;

    return res.status(200).json({
      success: true,
      profile: {
        fullName: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        location: customer.location || "",
        preferredLanguage: customer.preferredLanguage || "English",
      },
    });
  } catch (error) {
    console.error("Get customer profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const customer = await getCustomer(req, res);
    if (!customer) return;

    const { fullName, email, mobile, location, preferredLanguage } =
      req.body || {};
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof mobile !== "string" ||
      typeof location !== "string" ||
      typeof preferredLanguage !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile details.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedMobile = mobile.trim();
    const normalizedLocation = location.trim();

    if (
      !normalizedName ||
      normalizedName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      normalizedEmail.length > 254 ||
      !normalizedMobile ||
      normalizedMobile.length > 30 ||
      normalizedLocation.length > 200 ||
      !["English", "Tamil", "Sinhala"].includes(preferredLanguage)
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more profile fields are invalid.",
      });
    }

    const existingEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: customer._id },
    }).select("_id");
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "That email address is already linked to another account.",
      });
    }

    customer.fullName = normalizedName;
    customer.email = normalizedEmail;
    customer.mobile = normalizedMobile;
    customer.location = normalizedLocation;
    customer.preferredLanguage = preferredLanguage;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        fullName: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        location: customer.location || "",
        preferredLanguage: customer.preferredLanguage || "English",
      },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        message: "That email address is already linked to another account.",
      });
    }
    console.error("Update customer profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update your profile.",
    });
  }
};

export const getCustomerVehicles = async (req, res) => {
  try {
    const customer = await getCustomer(req, res);
    if (!customer) return;

    const vehicles = await CustomerVehicle.find({ customer: req.user }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      vehicles: vehicles.map(serializeVehicle),
    });
  } catch (error) {
    console.error("Get customer vehicles error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load your vehicles.",
    });
  }
};

export const createCustomerVehicle = async (req, res) => {
  try {
    const customer = await getCustomer(req, res);
    if (!customer) return;

    const { vehicleType, vehicleModel, vehicleNumber } = req.body || {};
    if (
      !allowedVehicleTypes.includes(vehicleType) ||
      typeof vehicleModel !== "string" ||
      typeof vehicleNumber !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid vehicle type, model, and number.",
      });
    }

    const model = vehicleModel.trim();
    const registrationNumber = vehicleNumber.trim().toUpperCase();
    if (
      !model ||
      model.length > 120 ||
      !registrationNumber ||
      registrationNumber.length > 32
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle model and number are required and must be valid.",
      });
    }

    const normalizedNumber = normalizeVehicleNumber(registrationNumber);
    const vehicle = await CustomerVehicle.create({
      customer: req.user,
      vehicleType,
      vehicleModel: model,
      vehicleNumber: registrationNumber,
      vehicleNumberNormalized: normalizedNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle registered successfully.",
      vehicle: serializeVehicle(vehicle),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this number is already registered.",
      });
    }
    console.error("Register customer vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to register this vehicle.",
    });
  }
};

export const deleteCustomerVehicle = async (req, res) => {
  try {
    const customer = await getCustomer(req, res);
    if (!customer) return;

    const { vehicleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const vehicle = await CustomerVehicle.findOneAndDelete({
      _id: vehicleId,
      customer: req.user,
    });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
      vehicleId,
    });
  } catch (error) {
    console.error("Delete customer vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete this vehicle.",
    });
  }
};
