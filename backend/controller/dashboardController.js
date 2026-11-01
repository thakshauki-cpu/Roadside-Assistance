
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import ServiceRequest from "../models/ServiceRequest.js";
import MechanicProfile from "../models/MechanicProfile.js";

export const getDashboardData = async (req, res) => {
  try {
    // Get logged-in customer details 
    const customer = await User.findById(req.user).select(
      "fullName email mobile role"
    );

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get customer's vehicles details
    const vehicles = await Vehicle.find({
      user: req.user,
    }).sort({ createdAt: -1 });

    // Get primary vehicle, otherwise latest vehicle
    const primaryVehicle =
      vehicles.find((vehicle) => vehicle.isPrimary) ||
      vehicles[0] ||
      null;

    // Count total requests
    const totalRequests = await ServiceRequest.countDocuments({
      customer: req.user,
    });

    // Count active requests
    const activeStatuses = [
      "pending",
      "searching",
      "assigned",
      "accepted",
      "on_the_way",
      "in_progress",
    ];

    const activeRequests = await ServiceRequest.countDocuments({
      customer: req.user,
      status: { $in: activeStatuses },
    });

    // Count completed requests
    const completedRequests = await ServiceRequest.countDocuments({
      customer: req.user,
      status: "completed",
    });

    // Get latest active request
    const activeRequest = await ServiceRequest.findOne({
      customer: req.user,
      status: { $in: activeStatuses },
    })
      .sort({ createdAt: -1 })
      .populate("vehicle")
      .populate("mechanic", "fullName mobile");

    // Get recent service history
    const recentRequests = await ServiceRequest.find({
      customer: req.user,
      status: { $in: ["completed", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("vehicle")
      .populate("mechanic", "fullName");

    // Get nearby available mechanics
    const nearbyMechanics = await MechanicProfile.find({
      isAvailable: true,
  
    })
      .populate("user", "fullName")
      .limit(5);

    return res.status(200).json({
      success: true,
      customer,
      overview: {
        totalRequests,
        activeRequests,
        completedRequests,
        totalVehicles: vehicles.length,
      },
      vehicles,
      primaryVehicle,
      activeRequest,
      recentRequests,
      nearbyMechanics,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};
