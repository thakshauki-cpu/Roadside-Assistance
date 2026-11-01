import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGOURI;

  if (!mongoURI) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI or MONGOURI in your .env file.");
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;