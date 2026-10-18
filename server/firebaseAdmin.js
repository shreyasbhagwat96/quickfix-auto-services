import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const serviceAccountPath = path.join(
    currentDirectory,
    "firebase-service-account.json"
);

export const firebaseEnabled = fs.existsSync(serviceAccountPath);

if (firebaseEnabled) {
    try {
        const serviceAccount = JSON.parse(
            fs.readFileSync(serviceAccountPath, "utf8")
        );

        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
            });
        }

        console.log("Firebase Admin initialized successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error.message);
        throw error;
    }
} else {
    console.warn(
        "Firebase credentials not found. Push notifications are disabled."
    );
}