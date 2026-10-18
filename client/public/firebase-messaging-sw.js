importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({

    apiKey: "AIzaSyDpBJ_-IT_oRsmrGTimB1NIZEZlIdvBsxY",
    authDomain: "quickfix-auto-services.firebaseapp.com",
    projectId: "quickfix-auto-services",
    storageBucket: "quickfix-auto-services.firebasestorage.app",
    messagingSenderId: "466506288806",
    appId: "1:466506288806:web:5e4a905251316567c62e67",
    measurementId: "G-6VE0BB3481"

});
// YAHAN FIREBASE CONSOLE WALA CONFIG PASTE KARO


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background message:", payload);

    self.registration.showNotification(
        payload.notification?.title || "QuickFix Auto Services",
        {
            body: payload.notification?.body || "New notification",
        }
    );
});