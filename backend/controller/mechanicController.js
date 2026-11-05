
import MechanicProfile from "../models/MechanicProfile.js";
import User from "../models/User.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

    if (typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      if (searchTerm.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search term must be 100 characters or fewer.",
        });
      }

      const searchRegex = new RegExp(escapeRegex(searchTerm), "i");
      const matchingMechanicUsers = await User.find({
        role: "mechanic",
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { mobile: searchRegex },
        ],
      })
        .select("_id")
        .lean();

      const searchConditions = [
        { businessName: searchRegex },
        { services: searchRegex },
        { "location.address": searchRegex },
        { phone: searchRegex },
        { verificationStatus: searchRegex },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: searchRegex.source,
              options: "i",
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $ifNull: [{ $toString: "$experience" }, ""] },
              regex: searchRegex.source,
              options: "i",
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: {
                $cond: [
                  "$isAvailable",
                  "Available Now",
                  "Unavailable",
                ],
              },
              regex: searchRegex.source,
              options: "i",
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: {
                $cond: [
                  "$isVerified",
                  "Verified Partner",
                  "Verification Pending",
                ],
              },
              regex: searchRegex.source,
              options: "i",
            },
          },
        },
        ...["createdAt", "updatedAt"].flatMap((dateField) => [
          {
            $expr: {
              $regexMatch: {
                input: {
                  $ifNull: [
                    {
                      $dateToString: {
                        date: `$${dateField}`,
                        format: "%Y-%m-%d %H:%M:%S",
                        timezone: "UTC",
                      },
                    },
                    "",
                  ],
                },
                regex: searchRegex.source,
                options: "i",
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $ifNull: [
                    {
                      $dateToString: {
                        date: `$${dateField}`,
                        format: "%d/%m/%Y",
                        timezone: "UTC",
                      },
                    },
                    "",
                  ],
                },
                regex: searchRegex.source,
                options: "i",
              },
            },
          },
        ]),
      ];

      if (matchingMechanicUsers.length > 0) {
        searchConditions.push({
          user: { $in: matchingMechanicUsers.map(({ _id }) => _id) },
        });
      }

      query.$or = searchConditions;
    }

    // Filter by selected service
    if (
      typeof service === "string" &&
      service.trim() &&
      service !== "All Services"
    ) {
      const serviceRegex = new RegExp(escapeRegex(service.trim()), "i");
      query.services = serviceRegex;
    }

    const [mechanics, availableCount] = await Promise.all([
      MechanicProfile.find(query)
        .populate("user", "fullName mobile")
        .sort({ createdAt: -1 })
        .lean(),
      MechanicProfile.countDocuments({ isAvailable: true }),
    ]);

    return res.status(200).json({
      success: true,
      count: mechanics.length,
      availableCount,
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
