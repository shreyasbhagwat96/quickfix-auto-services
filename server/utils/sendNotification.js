import { getMessaging } from "firebase-admin/messaging";
import { firebaseEnabled } from "../firebaseAdmin.js";

export const sendNotification = async (token, title, body) => {
    if (!firebaseEnabled) {
        console.log("Firebase disabled. Skipping push notification.");
        return;
    }

    if (!token) {
        console.log("FCM token not available.");
        return;
    }

    try {
        const message = {
            token,
            notification: {
                title,
                body,
            },
        };

        const response = await getMessaging().send(message);

        console.log("Notification sent:", response);

        return response;
    } catch (error) {
        console.error("Notification failed:", error.message);
    }
};