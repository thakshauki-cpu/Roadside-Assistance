   
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

    const coordinates = location.coordinates;
    if (
      coordinates !== undefined &&
      (!Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -180 ||
        coordinates[0] > 180 ||
        coordinates[1] < -90 ||
        coordinates[1] > 90)
    ) {
      return res.status(400).json({
        message: "Please provide valid longitude and latitude coordinates.",
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

    const normalizedRegistrationNumber = registrationNumber?.trim().toUpperCase();
    let serviceVehicle;

    if (normalizedRegistrationNumber) {
      serviceVehicle = await Vehicle.findOne({
        user: req.user,
        registrationNumber: normalizedRegistrationNumber,
      });

      if (serviceVehicle) {
        serviceVehicle.vehicleType = vehicleType;
        if (model?.trim()) {
          serviceVehicle.model = model.trim();
        }
        await serviceVehicle.save();
      }
    }

    if (!serviceVehicle) {
      try {
        createdVehicle = await Vehicle.create({
          user: req.user,
          vehicleType,

          ...(model?.trim() && {
            model: model.trim(),
          }),

          ...(normalizedRegistrationNumber && {
            registrationNumber: normalizedRegistrationNumber,
          }),
        });
        serviceVehicle = createdVehicle;
      } catch (error) {
        if (
          error.code === 11000 &&
          error.keyPattern?.registrationNumber &&
          normalizedRegistrationNumber
        ) {
          return res.status(409).json({
            message:
              "This registration number is already linked to another account. Check the number and try again.",
          });
        }

        throw error;
      }
    }

    // Create Service Request
    const serviceRequest = await ServiceRequest.create({
      customer: req.user,
      vehicle: serviceVehicle._id,

      location: {
        address: location.address.trim(),
        landmark: location.landmark || "",
        details: location.details || "",
        ...(coordinates && { coordinates }),
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