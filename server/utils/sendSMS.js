import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: "Your appointment has been confirmed.",
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });

        console.log("✅ SMS sent:", result.sid);
        return result;
    } catch (error) {
        console.error("❌ SMS failed:", error.message);
        throw error;
    }
};