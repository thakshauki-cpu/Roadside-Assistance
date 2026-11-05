import mongoose from "mongoose";
import Review from "../models/Review.js";
import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";

const getReviewStats = async (filter = {}) => {
  const [stats] = await Review.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return {
    averageRating: stats ? Number(stats.averageRating.toFixed(2)) : 0,
    totalReviews: stats?.totalReviews || 0,
  };
};

const getReviewPopulatedQuery = (filter) =>
  Review.find(filter)
    .populate("customerId", "fullName")
    .populate("mechanicId", "fullName")
    .populate({
      path: "serviceRequestId",
      select: "problem location createdAt completedAt vehicle",
      populate: {
        path: "vehicle",
        select: "vehicleType model registrationNumber",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

export const getCustomerReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({ message: "Invalid service request ID." });
    }

    const request = await ServiceRequest.findOne({
      _id: req.params.requestId,
      customer: req.user,
    }).select("_id");

    if (!request) {
      return res.status(404).json({ message: "Service request not found." });
    }

    const review = await Review.findOne({
      serviceRequestId: request._id,
      customerId: req.user,
    }).lean();

    return res.status(200).json({ review });
  } catch (error) {
    console.error("Get customer review error:", error);
    return res.status(500).json({ message: "Failed to fetch the review." });
  }
};

export const submitCustomerReview = async (req, res) => {
  try {
    const customer = await User.findById(req.user).select("role isActive");
    if (!customer || customer.role !== "customer" || !customer.isActive) {
      return res.status(403).json({
        message: "Only an active customer can submit a review.",
      });
    }

    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid service request ID." });
    }

    const { rating, comment } = req.body || {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be a whole number from 1 to 5.",
      });
    }
    if (
      typeof comment !== "string" ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Review comment must contain 1 to 1000 characters.",
      });
    }

    const request = await ServiceRequest.findOne({
      _id: requestId,
      customer: req.user,
    }).select("status mechanic");

    if (!request) {
      return res.status(404).json({ message: "Service request not found." });
    }
    if (request.status !== "completed") {
      return res.status(409).json({
        message: "A review can only be submitted for a completed service request.",
      });
    }
    if (!request.mechanic) {
      return res.status(409).json({
        message: "This completed request does not have an assigned mechanic.",
      });
    }

    const mechanic = await User.findOne({
      _id: request.mechanic,
      role: "mechanic",
    }).select("_id");
    if (!mechanic) {
      return res.status(409).json({
        message: "The assigned mechanic could not be verified.",
      });
    }

    const existingReview = await Review.findOne({
      serviceRequestId: request._id,
    }).select("_id");
    if (existingReview) {
      return res.status(409).json({
        message: "A review has already been submitted for this service request.",
      });
    }

    const review = await Review.create({
      customerId: customer._id,
      mechanicId: mechanic._id,
      serviceRequestId: request._id,
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      message: "Thank you. Your review was submitted successfully.",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A review has already been submitted for this service request.",
      });
    }
    console.error("Submit customer review error:", error);
    return res.status(500).json({ message: "Failed to submit your review." });
  }
};

export const getMechanicReviews = async (req, res) => {
  try {
    const [reviews, stats] = await Promise.all([
      getReviewPopulatedQuery({ mechanicId: req.user }),
      getReviewStats({ mechanicId: new mongoose.Types.ObjectId(req.user) }),
    ]);

    return res.status(200).json({ reviews, stats });
  } catch (error) {
    console.error("Get mechanic reviews error:", error);
    return res.status(500).json({ message: "Failed to fetch mechanic reviews." });
  }
};

export const getAdminReviews = async (_req, res) => {
  try {
    const [reviews, stats] = await Promise.all([
      getReviewPopulatedQuery({}),
      getReviewStats(),
    ]);

    return res.status(200).json({ reviews, stats });
  } catch (error) {
    console.error("Get admin reviews error:", error);
    return res.status(500).json({ message: "Failed to fetch customer reviews." });
  }
};
