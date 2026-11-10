const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Eventora Booking Confirmation',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #333;">Booking Confirmation</h2>
                    <p>Hi ${userName},</p>
                    <p>Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
                    <p>Thank you for choosing Eventora!</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Booking email sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending booking email to ${userEmail}:`, error);
    }
};

const sendOtpEmail = async (email, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Eventora account:'
            : 'Please use the following OTP to verify and confirm your event booking on Eventora.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: title,
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #333;">${title}</h2>
            <p>${msg}</p>
            <div style="font-size: 24px; font-weight: bold; color: #007BFF; margin: 20px 0;">${otp}</div>
            <p style="color: #555;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
            <p style="color: #555;">If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email} for ${type}`);
    } catch (error) {
        console.error(`Error sending OTP email to ${email} for ${type}:`, error);
    }
};

module.exports = { sendOtpEmail, sendBookingEmail };