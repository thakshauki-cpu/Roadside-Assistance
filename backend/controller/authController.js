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
      address,
      longitude,
      latitude,
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
        !address?.trim() ||
        longitude === undefined ||
        latitude === undefined
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
      const lng = Number(longitude);
      const lat = Number(latitude);

      if (!Number.isFinite(exp) || exp < 0 || exp > 70) {
        return res.status(400).json({
          message: "Please enter valid years of experience.",
        });
      }

      if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180 ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
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
            address: address.trim(),
            coordinates: [
              Number(longitude),
              Number(latitude),
            ],
          },
          isAvailable: false,
          isVerified: false,
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
      return res.status(403).json({
        message: "This account does not belong to the selected role.",
      });
    }

    // No Admin approval check at this stage
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