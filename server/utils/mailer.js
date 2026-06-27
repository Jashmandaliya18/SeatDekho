import transporter from '../config/nodemailer.js';
import dotenv from 'dotenv';
dotenv.config();

const SENDER_EMAIL = process.env.SENDER_EMAIL ;

export const sendConfirmationEmail = async (booking, show) => {
  try {
    const formattedDate = new Date(show.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const mailOptions = {
      from: `"SeatBook Tickets" <${SENDER_EMAIL}>`,
      to: booking.customerDetails.email,
      subject: `Booking Confirmed! Your Ticket for ${show.title} - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SEATBOOK / રંગમંચ</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">Official Booking Confirmation</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #374151; font-weight: bold;">Hello ${booking.customerDetails.name},</p>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.6;">Your seats have been successfully reserved! Please find your ticket details and entry QR code below.</p>
          </div>

          <div style="background-color: #ffffff; border: 1px dashed #d1d5db; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Drama Show</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 900; text-align: right;">${show.title}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Booking ID</td>
                <td style="padding: 6px 0; color: #d97706; font-weight: bold; font-family: monospace; text-align: right;">${booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Date & Time</td>
                <td style="padding: 6px 0; color: #111827; text-align: right;">${formattedDate} at ${show.time} (IST)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Venue</td>
                <td style="padding: 6px 0; color: #111827; text-align: right; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${show.venue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-weight: bold;">Assigned Seats</td>
                <td style="padding: 6px 0; color: #111827; font-weight: bold; text-align: right;">${booking.seats.join(', ')}</td>
              </tr>
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 10px 0 0 0; color: #374151; font-weight: 900; font-size: 14px;">Total Paid</td>
                <td style="padding: 10px 0 0 0; color: #800020; font-weight: 900; font-size: 16px; text-align: right;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 25px; padding: 15px; background-color: #fafafa; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #6b7280; font-weight: bold; uppercase;">SCAN THIS CODE AT THE ENTRANCE GATE</p>
            <img src="cid:qrcode" alt="Entry QR Ticket" style="width: 180px; height: 180px; border: 1px solid #e5e7eb; padding: 5px; border-radius: 8px; background-color: #fff;" />
            <p style="margin: 10px 0 0 0; font-size: 10px; color: #9ca3af;">Please show this email/QR code on your smartphone at the ticket box office check-in.</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center;">
            <p style="margin: 0 0 5px 0;">Need assistance? Contact our helpline at +91 79 2658 8900.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SeatBook Platform. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `ticket-${booking.bookingId}.png`,
        path: booking.qrCodeUrl, 
        cid: 'qrcode'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent successfully to ${booking.customerDetails.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    
    return null;
  }
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"SeatBook Verification" <${SENDER_EMAIL}>`,
      to: email,
      subject: `SeatBook - OTP Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SEATBOOK / રંગમંચ</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">OTP Verification Code</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #374151; font-weight: bold;">Hello,</p>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.6;">You are attempting to register or log in to SeatBook. Please use the following One-Time Password (OTP) to complete the verification process.</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: 950; letter-spacing: 4px; color: #b91c1c;">${otp}</span>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center;">
            <p style="margin: 0 0 5px 0;">If you did not request this verification code, please ignore this email.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SeatBook Platform. All rights reserved.</p>
          </div>
        </div>
      `
    };

    console.log(`[DEVELOPER OTP BYPASS] Sent OTP to ${email}: ${otp}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Failed to send OTP email via SMTP:', error.message);
    console.log(`[CRITICAL BYPASS] OTP for ${email} is ${otp}`);
    return null;
  }
};

