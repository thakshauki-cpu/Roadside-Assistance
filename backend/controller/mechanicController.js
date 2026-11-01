
import MechanicProfile from "../models/MechanicProfile.js";

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
