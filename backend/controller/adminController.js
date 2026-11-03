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




// Get mechanic verification applications
export const getAdminMechanics = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    let query = {};

    if (status === "pending") {
      query = {
        isVerified: { $ne: true },
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: { $exists: false } },
        ],
      };
    } else if (status === "approved") {
      query = {
        $or: [
          { verificationStatus: "approved" },
          { isVerified: true },
        ],
      };
    } else if (status === "rejected") {
      query = { verificationStatus: "rejected" };
    }

    const mechanics = await MechanicProfile.find(query)
      .populate("user", "fullName email mobile")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: mechanics.length,
      mechanics,
    });
  } catch (error) {
    console.error("Admin get mechanics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mechanic applications",
    });
  }
};


// Approve mechanic
export const approveMechanic = async (req, res) => {
  try {
    const mechanic = await MechanicProfile.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verificationStatus: "approved",
      },
      { new: true, runValidators: true }
    ).populate("user", "fullName email mobile");

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mechanic approved successfully",
      mechanic,
    });
  } catch (error) {
    console.error("Approve mechanic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve mechanic",
    });
  }
};


// Reject mechanic
export const rejectMechanic = async (req, res) => {
  try {
    const mechanic = await MechanicProfile.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: false,
        verificationStatus: "rejected",
      },
      { new: true, runValidators: true }
    ).populate("user", "fullName email mobile");

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mechanic rejected successfully",
      mechanic,
    });
  } catch (error) {
    console.error("Reject mechanic error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject mechanic",
    });
  }
};

// CUSTOMER MANAGEMENT
// GET ALL CUSTOMERS + SEARCH
// GET /api/admin/customers


export const getAdminCustomers = async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const query = {
      role: "customer",
    };

    // Search by name, email or mobile
    if (search.trim()) {
      const safeSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      query.$or = [
        { fullName: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { mobile: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter by account status
    if (status === "Active") {
      query.isActive = { $ne: false };
    } else if (status === "Blocked") {
      query.isActive = false;
    }

    const [
      customers,
      totalCustomers,
      totalActive,
      totalBlocked,
    ] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage),

      User.countDocuments(query),

      User.countDocuments({
        role: "customer",
        isActive: { $ne: false },
      }),

      User.countDocuments({
        role: "customer",
        isActive: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      totalCustomers,
      totalActive,
      totalBlocked,
      currentPage,
      totalPages: Math.ceil(totalCustomers / perPage),
      customers,
    });
  } catch (error) {
    console.error("Admin get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers.",
    });
  }
};



// GET SINGLE CUSTOMER DETAILS
// GET /api/admin/customers/:id

export const getAdminCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    }).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const [totalRequests, recentRequests] = await Promise.all([
      ServiceRequest.countDocuments({
        customer: customer._id,
      }),

      ServiceRequest.find({
        customer: customer._id,
      })
        .populate("vehicle", "vehicleType model registrationNumber")
        .populate("mechanic", "fullName mobile")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      customer,
      totalRequests,
      recentRequests,
    });
  } catch (error) {
    console.error("Admin customer details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer details.",
    });
  }
};


// ACTIVATE / DEACTIVATE CUSTOMER
// PATCH /api/admin/customers/:id/status

export const updateCustomerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid isActive value.",
      });
    }

    const customer = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "customer",
      },
      {
        isActive,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Customer activated successfully."
        : "Customer deactivated successfully.",
      customer,
    });
  } catch (error) {
    console.error("Update customer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer status.",
    });
  }
};


// GET SINGLE MECHANIC DETAILS
// GET /api/admin/mechanics/:id

export const getAdminMechanicById = async (req, res) => {
  try {
    const mechanic = await MechanicProfile.findById(req.params.id)
      .populate("user", "fullName email mobile createdAt");

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found.",
      });
    }

    return res.status(200).json({
      success: true,
      mechanic,
    });

  } catch (error) {
    console.error("Admin mechanic details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mechanic details.",
    });
  }
};
