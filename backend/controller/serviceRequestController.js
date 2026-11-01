   
// இந்த code ஒரே Submit-ல்:
// 1. Customer details பெறும்.
// 2. Vehicle-ஐ MongoDB-ல் புதிதாக save செய்யும்.
// 3. Service Request-ஐ உருவாக்கும்.
// 4. Vehicle ID மற்றும் Customer ID-ஐ இணைக்கும்.




import Vehicle from "../models/Vehicle.js";
import ServiceRequest from "../models/ServiceRequest.js";

// Create Service Request
export const createServiceRequest = async (req, res) => {
  let createdVehicle;

  try {
    // Get data from frontend
    const {
      location,
      vehicle,
      problem,
      description,
    } = req.body;

    // Check location
    if (!location?.address?.trim()) {
      return res.status(400).json({
        message: "Please provide your location.",
      });
    }

    // Get vehicle details
    const {
      vehicleType,
      model,
      registrationNumber,
    } = vehicle || {};

    // Check required vehicle type
    if (!vehicleType) {
      return res.status(400).json({
        message: "Please select your vehicle type.",
      });
    }

    // Check problem
    if (!problem || !problem.trim()) {
      return res.status(400).json({
        message: "Please select your vehicle problem.",
      });
    }

    // Create Vehicle
    createdVehicle = await Vehicle.create({
      user: req.user,
      vehicleType,

      ...(model?.trim() && {
        model: model.trim(),
      }),

      ...(registrationNumber?.trim() && {
        registrationNumber: registrationNumber.trim().toUpperCase(),
      }),
    });

    // Create Service Request
    const serviceRequest = await ServiceRequest.create({
      customer: req.user,
      vehicle: createdVehicle._id,

      location: {
        address: location.address.trim(),
        landmark: location.landmark || "",
        details: location.details || "",
      },

      problem: problem.trim(),
      description: description || "",
    });

    // Success response
    return res.status(201).json({
      message: "Service request created successfully.",
      serviceRequest,
    });

  } catch (error) {
    // Delete vehicle if service request creation fails
    if (createdVehicle) {
      await Vehicle.findByIdAndDelete(createdVehicle._id);
    }

    console.error("Create Service Request Error:", error);

    return res.status(500).json({
      message: "Failed to create service request.",
      error: error.message,
    });
  }
};