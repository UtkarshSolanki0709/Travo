import { Resend } from "resend";
import { ENV } from "../lib/env.js";

// Initialize Resend with API key from environment variables
const resend = new Resend(ENV.RESEND_API_KEY);

export const sendWelcomeEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Your App <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Our Platform 🎉",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #4F46E5; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome! 🎉</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px; color: #333333;">
              <h2 style="margin-top: 0; color: #111827;">Hello ${name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4B5563;">
                We are thrilled to have you here! Our platform is perfectly crafted to help you connect, explore, and get things done efficiently.
              </p>
              
              <!-- Call-to-action -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${ENV.CLIENT_URL || '#'}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Start exploring now
                </a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #4B5563;">
                If you have any questions or need a hand getting started, simply reply to this email &mdash; we’re always here to help!
              </p>

              <p style="font-size: 16px; margin-top: 30px; color: #4B5563;">
                Best regards,<br>
                <strong>The App Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 13px; color: #6B7280;">
                You're receiving this because you securely signed up on our platform.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending welcome email via Resend API:", error);
      return;
    }

    console.log("Welcome email sent successfully! Message ID:", data?.id);
  } catch (err) {
    console.error("Critical error in sendWelcomeEmail function:", err);
  }
};
