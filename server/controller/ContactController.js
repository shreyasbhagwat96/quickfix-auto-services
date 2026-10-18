import Contact from "../models/Contact.js";
import User from "../models/UserModel.js";
import { sendNotification } from "../utils/sendNotification.js";

export const saveContact = async (req, res) => {
    try {
        const userContact = new Contact({ ...req.body });
        await userContact.save();
        // 🔔 Notify Admin about new contact message
        const admin = await User.findOne({ role: "Admin" });

        if (admin?.fcmToken) {
            console.log("🔔 Admin FCM token found");

            await sendNotification(
                admin.fcmToken,
                "New Contact Message 📩",
                `New message from ${req.body.name || "User"}`
            );
        } else {
            console.log("❌ Admin FCM token not found");
        }

        res.status(200).json({ message: 'data saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

export const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Contact.find();
        res.status(200).json({ feedbacks });
    } catch (error) {
        res.status(400).json({ message: "error in getting user feedbacks" });
    }
}