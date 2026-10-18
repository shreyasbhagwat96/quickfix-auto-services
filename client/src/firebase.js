import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {

    apiKey: "AIzaSyDpBJ_-IT_oRsmrGTimB1NIZEZlIdvBsxY",
    authDomain: "quickfix-auto-services.firebaseapp.com",
    projectId: "quickfix-auto-services",
    storageBucket: "quickfix-auto-services.firebasestorage.app",
    messagingSenderId: "466506288806",
    appId: "1:466506288806:web:5e4a905251316567c62e67",
    measurementId: "G-6VE0BB3481"
    // APNI EXISTING FIREBASE CONFIG YAHAN SAME RAKHO
};

const app = initializeApp(firebaseConfig);

export const VAPID_KEY = "BCR5LwSTiI4ZIH3PReXhH3PcG6CQgdlQ6ugLwzWAyk5u_yPD93vWbETHdh3SZOxdwmy3l7AsDES74dJA9Quvxck";

// Firebase Messaging sirf supported browser/context me initialize hoga
export const messaging =
    typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator
        ? getMessaging(app)
        : null;

export const requestNotificationPermission = async () => {
    try {
        if (!("Notification" in window)) {
            console.log("❌ Notifications are not supported");
            return false;
        }

        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("✅ Notification permission granted");
            return true;
        }

        console.log("❌ Notification permission denied");
        return false;
    } catch (error) {
        console.error("❌ Notification permission error:", error);
        return false;
    }
};

export const getFCMToken = async () => {
    try {
        if (!messaging) {
            console.log("❌ Firebase Messaging not supported here");
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
        });

        if (token) {
            console.log("✅ FCM Token:", token);
            return token;
        }

        console.log("❌ No FCM token available");
        return null;
    } catch (error) {
        console.error("❌ FCM Token Error:", error);
        return null;
    }
};

export default app;