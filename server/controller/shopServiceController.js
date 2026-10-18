import ShopService from "../models/ShopServiceModel.js";
import { sendNotification } from "../utils/sendNotification.js";
import Notification from "../models/Notification.js";
import sendEmail from "../config/sendEmail.js";
import Booking from "../models/Booking.js";
import User from "../models/UserModel.js";
// ======================================================
// CREATE OR UPDATE SHOP
// ======================================================
export const createOrUpdateShop = async (req, res) => {
  try {
    const { name, contact, location, timings, services, coordinates } =
      req.body;

    const userId = req.user._id;

    const parsedServices =
      typeof services === "string" ? JSON.parse(services) : services;

    const parsedCoordinates =
      typeof coordinates === "string"
        ? JSON.parse(coordinates)
        : coordinates;

    const photoPaths = req.files?.map((file) => file.path) || [];

    let existingShop = await ShopService.findOne({ owner: userId });

    if (existingShop) {
      existingShop.name = name;
      existingShop.contact = contact;
      existingShop.location = location;
      existingShop.timings = timings;
      existingShop.services = parsedServices;

      existingShop.coordinates = {
        type: "Point",
        coordinates: parsedCoordinates,
      };

      existingShop.photos = [...existingShop.photos, ...photoPaths];

      const updated = await existingShop.save();

      return res.status(200).json(updated);
    }

    const newShop = await ShopService.create({
      owner: userId,
      name,
      contact,
      location,
      timings,
      services: parsedServices,
      coordinates: {
        type: "Point",
        coordinates: parsedCoordinates,
      },
      photos: photoPaths,
    });

    res.status(201).json(newShop);
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET MY SHOP
// ======================================================
export const getMyShop = async (req, res) => {
  try {
    const shop = await ShopService.findOne({
      owner: req.user._id,
    });

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL SHOPS
// ======================================================
export const getAllShops = async (req, res) => {
  try {
    const shops = await ShopService.find().populate(
      "owner",
      "name email"
    );

    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET SHOP BY ID
// ======================================================
export const getShopById = async (req, res) => {
  try {
    const shop = await ShopService.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================================
// GET NEARBY SHOPS
// ======================================================
export const getNearbyShops = async (req, res) => {
  const { lng, lat } = req.query;

  console.log(lng, " and ", lat);

  if (!lng || !lat) {
    return res.status(400).json({
      message: "Missing longitude or latitude",
    });
  }

  try {
    const shops = await ShopService.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [
              parseFloat(lng),
              parseFloat(lat),
            ],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 1000000,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      {
        $unwind: "$ownerDetails",
      },
      {
        $project: {
          name: 1,
          contact: 1,
          location: 1,
          timings: 1,
          photos: 1,
          coordinates: 1,
          services: 1,
          distance: 1,
          "owner.email": "$ownerDetails.email",
          "owner.name": "$ownerDetails.name",
        },
      },
    ]);

    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE BOOKING
// ======================================================
export const createBooking = async (req, res) => {
  console.log(req);

  const {
    shopId,
    vehicleName,
    issue,
    towingNeeded,
    userLat,
    userLng,
  } = req.body;

  if (!shopId || !vehicleName || !issue) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    // Find recent bookings within 45 minutes
    const now = Date.now();

    const windowStart = new Date(
      now - 45 * 60 * 1000
    );

    const oldBookings = await Booking.find({
      user: req.user._id,
      status: {
        $in: ["Pending", "Waiting", "Rejected"],
      },
      createdAt: {
        $gte: windowStart,
      },
    });

    for (const old of oldBookings) {
      if (
        old.shopId.toString() !== shopId.toString() &&
        !old.statusDetails?.message?.includes(
          "User booked another shop"
        )
      ) {
        old.status = "Replaced";

        old.statusDetails = {
          message:
            "User booked another shop within 45 minutes.",
        };

        await old.save();

        const previousShop =
          await ShopService.findById(old.shopId).populate(
            "owner",
            "email name"
          );

        if (previousShop?.owner) {
          await Notification.create({
            to: previousShop.owner._id,
            message: `⚠️ Booking ${old._id} was replaced by user.`,
            type: "booking-replaced",
            relatedBooking: old._id,
            createdAt: new Date(),
          });

          await sendEmail({
            to: previousShop.owner.email,
            subject: "Booking Replaced by User",
            html: `
              <p>Hello ${previousShop.owner.name},</p>
              <p>The user booked another shop within 45 minutes.</p>
              <p><strong>Booking ID:</strong> ${old._id}</p>
              <p><strong>Vehicle:</strong> ${old.vehicleName}</p>
              <p><strong>Issue:</strong> ${old.issue}</p>
              <p>This booking is marked as <strong>Replaced</strong>.</p>
            `,
          });
        }
      }
    }

    // Create new booking
    const booking = new Booking({
      user: req.user._id,
      shopId,
      vehicleName,
      issue,
      towingNeeded,

      userLocation: {
        type: "Point",
        coordinates: [
          userLng,
          userLat,
        ],
      },

      adminCommission: 20,
      shopOwnerEarning: 80,
    });

    if (req.file) {
      booking.paymentImage =
        `/uploads/bookings/${req.file.filename}`;
    }

    await booking.save();
    // 🔔 Notify user about booking status


    res.status(201).json({
      message: "Booking created",
      booking,
    });
  } catch (error) {
    console.error(
      "Error in createBooking:",
      error
    );

    res.status(500).json({
      message: "Error creating booking",
      error: error.message,
    });
  }
};

// ======================================================
// GET SHOP BOOKINGS
// ======================================================
export const getShopBookings = async (req, res) => {
  try {
    const shop = await ShopService.findOne({
      owner: req.user._id,
    });

    if (!shop) {
      console.log(
        "🚫 Shop not found for owner:",
        req.user._id
      );

      return res.status(404).json({
        message: "Shop not found",
      });
    }

    // Mark all unseen bookings as seen
    await Booking.updateMany(
      {
        shopId: shop._id,
        seenByShop: false,
      },
      {
        $set: {
          seenByShop: true,
        },
      }
    );

    // Fetch ALL bookings for this shop
    const bookings = await Booking.find({
      shopId: shop._id,
    })
      .populate(
        "user",
        "name email phoneNumber profilePicture firstName lastName"
      )
      .populate(
        "shopId",
        "coordinates"
      )
      .sort({
        createdAt: -1,
      });

    console.log(
      "✅ Bookings fetched:",
      bookings.length
    );

    res.status(200).json(bookings);
  } catch (error) {
    console.error(
      "❌ Error in getShopBookings:",
      error
    );

    res.status(500).json({
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE BOOKING STATUS
// ======================================================
export const updateBookingStatus = async (req, res) => {
  console.log("🔥 updateBookingStatus CALLED");

  const { id } = req.params;

  const {
    status,
    scheduledTime,
    rejectionMessage,
  } = req.body;

  try {
    const booking =
      await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (status === "Approved") {
      booking.status = "Approved";
      booking.scheduledTime = null;
      booking.rejectionMessage = null;

      booking.statusDetails = {
        message: "Approved",
      };
    } else if (status === "Scheduled") {
      booking.status = "Scheduled";
      booking.scheduledTime = scheduledTime;
      booking.rejectionMessage = null;

      booking.statusDetails = {
        message: `Scheduled at ${scheduledTime}`,
      };
    } else if (status === "Rejected") {
      booking.status = "Rejected";
      booking.rejectionMessage =
        rejectionMessage;

      booking.scheduledTime = null;

      booking.statusDetails = {
        message: `Rejected: ${rejectionMessage}`,
      };
    }

    await booking.save();
    // 🔔 Find shop owner
    const shop = await ShopService.findById(booking.shopId).populate(
      "owner",
      "userName fcmToken"
    );

    console.log("🏪 Shop owner:", shop?.owner?.userName);
    if (shop?.owner?.fcmToken) {
      console.log("🔔 Shop Owner FCM token found");

      await sendNotification(
        shop.owner.fcmToken,
        "New Booking 🔔",
        `New booking for ${booking.vehicleName}. Issue: ${booking.issue}`
      );
    } else {
      console.log("❌ Shop Owner FCM token not found");
    }
    console.log("🔔 Checking FCM notification for user:", booking.user);

    if (booking.user) {
      const user = await User.findById(booking.user);
      console.log("🔔 Booking user:", user?.userName, user?.role);

      if (user?.fcmToken) {
        console.log("🔔 User FCM token found");

        await sendNotification(
          user.fcmToken,
          `Booking ${booking.status}`,
          booking.statusDetails?.message ||
          "Your booking status has been updated."
        );
      } else {
        console.log("❌ User FCM token not found");
      }
    }

    res.status(200).json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating booking",
      error: error.message,
    });
  }
};

// ======================================================
// MARK BOOKING COMPLETED
// ======================================================
export const markBookingCompleted = async (
  req,
  res
) => {
  const { id } = req.params;

  const booking =
    await Booking.findById(id);

  if (!booking) {
    return res.status(404).json({
      message: "Booking not found",
    });
  }

  if (
    !["Approved", "Scheduled"].includes(
      booking.status
    )
  ) {
    return res.status(400).json({
      message:
        "Only Approved or Scheduled bookings can be marked completed",
    });
  }

  booking.status = "Completed";

  booking.statusDetails = {
    message: "Job completed",
  };

  await booking.save();

  res.status(200).json({
    message: "Booking marked as completed",
  });
};

// ======================================================
// GET OLD BOOKINGS
// ======================================================
export const getOldBookings = async (
  req,
  res
) => {
  try {
    const userId = req.user._id;

    const shop =
      await ShopService.findOne({
        owner: userId,
      });

    if (!shop) {
      return res.status(404).json({
        message: "No shop found for this user",
      });
    }

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      shopId: shop._id,
      createdAt: {
        $lt: todayStart,
      },
    }).populate(
      "user",
      "firstName email"
    );

    res.status(200).json(bookings);
  } catch (error) {
    console.error(
      "❌ Error fetching old bookings:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET TODAY'S BOOKINGS
// ======================================================
export const getTodaysBookings = async (
  req,
  res
) => {
  try {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const end = new Date();

    end.setHours(23, 59, 59, 999);

    const todaysBookings =
      await Booking.find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
        .populate(
          "user",
          "firstName email"
        )
        .populate(
          "shopId",
          "name"
        );

    res.status(200).json(
      todaysBookings
    );
  } catch (error) {
    console.error(
      "Error fetching today's bookings:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET REVIEWS
// ======================================================
export const getReviews = async (
  req,
  res
) => {
  try {
    const { shopId } = req.params;

    const shop =
      await ShopService.findById(
        shopId
      ).populate(
        "reviews.user",
        "name"
      );

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.status(200).json(
      shop.reviews
    );
  } catch (err) {
    console.error(
      "GET REVIEW ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ======================================================
// POST REVIEW
// ======================================================
export const postReview = async (
  req,
  res
) => {
  try {
    const { shopId } = req.params;

    const {
      rating,
      comment,
    } = req.body;

    const userId = req.user._id;

    if (!rating || isNaN(rating)) {
      return res.status(400).json({
        message:
          "Rating is required and must be a number",
      });
    }

    const shop =
      await ShopService.findById(
        shopId
      );

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    const existingReviewIndex =
      shop.reviews.findIndex(
        (r) =>
          r.user.toString() ===
          userId.toString()
      );

    const review = {
      user: userId,
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date(),
    };

    if (existingReviewIndex >= 0) {
      shop.reviews[
        existingReviewIndex
      ] = review;
    } else {
      shop.reviews.push(review);
    }

    if (shop.reviews.length > 0) {
      const total =
        shop.reviews.reduce(
          (sum, r) =>
            sum + r.rating,
          0
        );

      shop.averageRating = (
        total /
        shop.reviews.length
      ).toFixed(1);
    }

    await shop.save();

    const populatedShop =
      await ShopService.findById(
        shopId
      ).populate(
        "reviews.user",
        "name email profilePicture"
      );

    res.status(201).json({
      message:
        "Review submitted successfully",
      reviews:
        populatedShop.reviews,
      averageRating:
        shop.averageRating,
    });
  } catch (err) {
    console.error(
      "Review Error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET SHOP REVIEWS
// ======================================================
export const getShopReviews = async (
  req,
  res
) => {
  try {
    const { shopId } = req.params;

    const shop =
      await ShopService.findById(
        shopId
      )
        .populate(
          "reviews.user",
          "name email profilePicture"
        )
        .select(
          "reviews averageRating"
        );

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    res.status(200).json({
      reviews: shop.reviews,
      averageRating:
        shop.averageRating,
    });
  } catch (error) {
    console.error(
      "Error fetching reviews:",
      error
    );

    res.status(500).json({
      message:
        "Server error while fetching reviews",
    });

  }
};