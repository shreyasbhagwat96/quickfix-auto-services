import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendEmail = async ({ to, subject, html }) => {

  // Email service disabled if API key is not configured
  if (!resend) {
    console.log(
      "⚠️ Email service disabled: RESEND_API_KEY not configured"
    );
    return null;
  }

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", response);

    return response;
  } catch (error) {
    console.error("❌ Resend Error:", error);
    throw error;
  }
};

export default sendEmail;