
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

const createAdmin = async () => {
  try {
    await connectDB();

    const fullName = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!fullName || !email || !password) {
      throw new Error("Admin details are missing in .env");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const existingAdmin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const admin = await Admin.create({
      fullName,
      email,
      password,
    });

    console.log("Admin created successfully.");
    console.log("Admin Email:", admin.email);

  } catch (error) {
    console.error("Admin creation error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
