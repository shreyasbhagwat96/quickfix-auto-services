import express from "express";
import User from "../models/UserModel.js";

import {
  cancelBooking,
  changePassword,
  deleteUser,
  findAllUsers,
  findUser,
  forgotPassword,
  getallBooks,
  getBookingHistory,
  getMyBookings,
  loginUser,
  logoutUser,
  registerUser,
  spamChecker,
  updateUser,
  updateUserProfile,
} from "../controller/UserController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const userRouter = express.Router();


// =========================
// AUTH
// =========================

userRouter.post("/login", loginUser);

userRouter.post("/", registerUser);


// =========================
// BOOKINGS
// =========================

userRouter.get(
  "/booking/history",
  protect,
  getBookingHistory
);

userRouter.get(
  "/booking/allhistory",
  protect,
  admin,
  getallBooks
);

userRouter.get(
  "/bookings/my",
  protect,
  getMyBookings
);

userRouter.delete(
  "/bookings/:id",
  protect,
  cancelBooking
);


// =========================
// USER
// =========================

userRouter.post(
  "/spam",
  spamChecker
);

userRouter.get(
  "/",
  protect,
  admin,
  findAllUsers
);

userRouter.put(
  "/logout",
  protect,
  logoutUser
);

userRouter.get(
  "/:email",
  findUser
);

userRouter.put(
  "/:userId",
  protect,
  admin,
  updateUser
);

userRouter.delete(
  "/:userId",
  protect,
  admin,
  deleteUser
);

userRouter.post(
  "/changePassword",
  protect,
  changePassword
);

userRouter.put(
  "/forgotPassword/:email",
  forgotPassword
);

userRouter.put(
  "/profile/:userId",
  protect,
  updateUserProfile
);


// =========================
// FCM TOKEN
// =========================

userRouter.post(
  "/fcm-token",
  protect,
  async (req, res) => {
    try {
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({
          message: "FCM token is required",
        });
      }

      await User.findByIdAndUpdate(
        req.user._id,
        {
          fcmToken,
        }
      );

      res.status(200).json({
        message: "FCM token saved successfully",
      });

    } catch (error) {
      console.error(
        "❌ FCM token save error:",
        error
      );

      res.status(500).json({
        message: "Failed to save FCM token",
      });
    }
  }
);


// =========================
// 404 ROUTE
// MUST BE LAST
// =========================

userRouter.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});


export default userRouter;