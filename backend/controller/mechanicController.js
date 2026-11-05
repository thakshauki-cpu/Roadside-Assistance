
import MechanicProfile from "../models/MechanicProfile.js";

export const getOwnMechanicProfile = async (req, res) => {
  try {
    const profile = await MechanicProfile.findOne({ user: req.user })
      .populate("user", "fullName email mobile")
      .lean();

    if (!profile) {
      return res.status(404).json({
        message: "Mechanic profile not found.",
      });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Get mechanic profile error:", error);
    return res.status(500).json({
      message: "Failed to fetch mechanic profile.",
    });
  }
};

export const updateOwnMechanicAvailability = async (req, res) => {
  const { isAvailable } = req.body;

  if (typeof isAvailable !== "boolean") {
    return res.status(400).json({
      message: "Availability must be true or false.",
    });
  }

  try {
    const profile = await MechanicProfile.findOne({ user: req.user });

    if (!profile) {
      return res.status(404).json({
        message: "Mechanic profile not found.",
      });
    }

    if (
      isAvailable &&
      (!profile.isVerified || profile.verificationStatus !== "approved")
    ) {
      return res.status(403).json({
        message: "Only verified and approved mechanics can become available.",
      });
    }

    profile.isAvailable = isAvailable;
    await profile.save();

    return res.status(200).json({
      message: "Availability updated successfully.",
      isAvailable: profile.isAvailable,
    });
  } catch (error) {
    console.error("Update mechanic availability error:", error);
    return res.status(500).json({
      message: "Failed to update mechanic availability.",
    });
  }
};

export const getMechanics = async (req, res) => {
  try {
    const { search, service, availableOnly } = req.query;

    const query = {};

    // Show available mechanics only when requested
    if (availableOnly === "true") {
      query.isAvailable = true;
    }

    // Search by business name, service or address
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      query.$or = [
        { businessName: searchRegex },
        { services: searchRegex },
        { "location.address": searchRegex },
      ];
    }

    // Filter by selected service
    if (service && service !== "All Services") {
      const serviceRegex = new RegExp(service.trim(), "i");
      query.services = serviceRegex;
    }

    const mechanics = await MechanicProfile.find(query)
      .populate("user", "fullName mobile")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: mechanics.length,
      mechanics,
    });
  } catch (error) {
    console.error("Get mechanics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mechanics",
    });
  }
};
