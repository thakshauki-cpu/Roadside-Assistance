//Admin login logic

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import User from "../models/User.js";
import MechanicProfile from "../models/MechanicProfile.js";
import ServiceRequest from "../models/ServiceRequest.js";

// Generate Admin JWT Token
const generateAdminToken = (adminId) => {
  return jwt.sign(
    {
      id: adminId,
      role: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d",
    }
  );
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Please provide email and password.",
      });
    }

    // Find Admin by email
    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Check Admin account status
    if (!admin.isActive) {
      return res.status(403).json({
        message: "Admin account is inactive.",
      });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = generateAdminToken(admin._id.toString());

    return res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};


// GET ADMIN PROFILE
// GET /api/admin/me

export const getAdminMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

// ADMIN DASHBOARD
// GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    // Request statuses considered active
    const activeStatuses = [
      "pending",
      "searching",
      "assigned",
      "accepted",
      "on_the_way",
      "in_progress",
    ];

    // Get all dashboard counts simultaneously
    const [
      totalCustomers,
      totalMechanics,
      verifiedMechanics,
      pendingMechanics,
      totalRequests,
      activeRequests,
      completedRequests,
      cancelledRequests,
    ] = await Promise.all([

      // Total customers
      User.countDocuments({
        role: "customer",
      }),

      // Total mechanics
      User.countDocuments({
        role: "mechanic",
      }),

      // Verified mechanic profiles
      MechanicProfile.countDocuments({
        isVerified: true,
      }),

      // Pending mechanic profiles
      MechanicProfile.countDocuments({
        isVerified: false,
      }),

      // Total service requests
      ServiceRequest.countDocuments(),

      // Active service requests
      ServiceRequest.countDocuments({
        status: { $in: activeStatuses },
      }),

      // Completed requests
      ServiceRequest.countDocuments({
        status: "completed",
      }),

      // Cancelled requests
      ServiceRequest.countDocuments({
        status: "cancelled",
      }),
    ]);

    // Get latest 5 service requests
    const recentRequests = await ServiceRequest.find()
      .populate("customer", "fullName email mobile")
      .populate("mechanic", "fullName mobile")
      .populate(
        "vehicle",
        "vehicleType model registrationNumber"
      )
      .sort({ createdAt: -1 })
      .limit(5);

    // Send dashboard data
    return res.status(200).json({
      success: true,

      overview: {
        totalCustomers,
        totalMechanics,
        verifiedMechanics,
        pendingMechanics,
        totalRequests,
        activeRequests,
        completedRequests,
        cancelledRequests,
      },

      recentRequests,
    });

  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
    });
  }
};
