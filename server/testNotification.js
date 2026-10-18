import dotenv from "dotenv";
dotenv.config();

import "./firebaseAdmin.js";




import mongoose from "mongoose";
import { sendNotification } from "./utils/sendNotification.js";
import User from "./models/UserModel.js";

await mongoose.connect(process.env.MONGOURL);

const admin = await User.findOne({ role: "Admin" });

if (!admin) {
    console.log("❌ Admin user not found");
    process.exit(1);
}

if (!admin.fcmToken) {
    console.log("❌ Admin FCM token not found");
    process.exit(1);
}

console.log("🔔 Using Admin token from MongoDB");

await sendNotification(
    admin.fcmToken,
    "QuickFix Test 🔔",
    "FCM notification is working successfully!"
);

await mongoose.disconnect();

console.log("✅ Test completed");