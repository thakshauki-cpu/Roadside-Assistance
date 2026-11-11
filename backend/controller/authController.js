
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import MechanicProfile from "../models/MechanicProfile.js";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Register User
export const registerUser = async (req, res) => {
  let createdUser = null;

  try {
    const {
      fullName,
      email,
      mobile,
      password,
      role,

      businessName,
      experience,
      services,
      location,
    } = req.body;

    // Required fields
    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Please fill in all required personal details.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const selectedRole = role || "customer";

    if (!["customer", "mechanic"].includes(selectedRole)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email.",
      });
    }

    // Mechanic-specific validation
    if (selectedRole === "mechanic") {
      if (
        !businessName?.trim() ||
        experience === undefined ||
        !Array.isArray(services) ||
        services.length === 0 ||
        !location?.address?.trim() ||
        !Array.isArray(location?.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          message: "Please complete all mechanic registration details.",
        });
      }

      const allowedServices = [
        "Tyre Repair",
        "Battery Jumpstart",
        "Engine Breakdown",
        "Fuel Delivery",
        "Towing",
        "General Repair",
      ];

      const validServices = services.every((service) =>
        allowedServices.includes(service)
      );

      if (!validServices) {
        return res.status(400).json({
          message: "Invalid service selection.",
        });
      }

      const exp = Number(experience);
      const longitude = Number(location.coordinates[0]);
      const latitude = Number(location.coordinates[1]);

      // Validate experience
      if (!Number.isFinite(exp) || exp < 0 || exp > 70) {
        return res.status(400).json({
          message: "Please enter valid years of experience.",
        });
      }

      // Validate coordinates
      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          message: "Please enter valid location coordinates.",
        });
      }
    }

    // Create User
    createdUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: mobile.trim(),
      password,
      role: selectedRole,
    });

    // Create Mechanic Profile
    if (selectedRole === "mechanic") {
      try {
        await MechanicProfile.create({
          user: createdUser._id,
          businessName: businessName.trim(),
          services,
          experience: Number(experience),
          phone: mobile.trim(),

          location: {
            address: location.address.trim(),
            coordinates: [
              Number(location.coordinates[0]),
              Number(location.coordinates[1]),
            ],
          },

          isAvailable: false,
          isVerified: false,
          verificationStatus: "pending",
        });
      } catch (profileError) {
        // Remove User if Mechanic Profile creation fails
        await User.findByIdAndDelete(createdUser._id);
        throw profileError;
      }
    }

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: createdUser._id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        mobile: createdUser.mobile,
        role: createdUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password || !role) {
      return res.status(400).json({
        message: "Please provide email, password and role.",
      });
    }

    if (!["customer", "mechanic"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.role === "mechanic") {
      const mechanicProfile = await MechanicProfile.findOne({
        user: user._id,
      }).select("isVerified verificationStatus");

      if (mechanicProfile?.verificationStatus === "pending") {
        return res.status(403).json({
          message:
            "Your account is waiting for admin verification. You can access your dashboard after approval.",
        });
      }

      if (mechanicProfile?.verificationStatus === "rejected") {
        return res.status(403).json({
          message:
            "Your mechanic account was rejected. Please contact support for more information.",
        });
      }

      if (
        mechanicProfile?.verificationStatus !== "approved" ||
        mechanicProfile.isVerified !== true
      ) {
        return res.status(403).json({
          message:
            "Your account has not been approved by an administrator.",
        });
      }
    }

    // Check whether the customer account is blocked
    if (user.role === "customer" && user.isActive === false) {
      return res.status(403).json({
        message:
          "Your account has been blocked by the administrator. Please contact support.",
      });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};

// Get Logged-in User
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};


