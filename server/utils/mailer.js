import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Smart check: Resend free tier only allows sending from 'onboarding@resend.dev'
// unless you have verified your own custom domain. If SENDER_EMAIL is Gmail or not set, use onboarding.
const rawSender = process.env.SENDER_EMAIL || '';
const SENDER_EMAIL = (rawSender.endsWith('@gmail.com') || rawSender === '') 
  ? 'onboarding@resend.dev' 
  : rawSender;

export const sendConfirmationEmail = async (booking, show) => {
  if (!RESEND_API_KEY) {
    console.warn('[RESEND WARNING] RESEND_API_KEY is not defined. Email will not be sent.');
    console.log(`[BYPASS LOG] Booking Confirmation for ${booking.customerDetails.email} (Booking ID: ${booking.bookingId})`);
    return null;
  }

  try {
    const formattedDate = new Date(show.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const attachments = [];
    if (booking.qrCodeUrl && booking.qrCodeUrl.startsWith('data:image/png;base64,')) {
      const base64Data = booking.qrCodeUrl.split(';base64,').pop();
      attachments.push({
        content: base64Data,
        filename: `ticket-${booking.bookingId}.png`,
        id: 'qrcode',
        content_type: 'image/png'
      });
    }

    const mailOptions = {
      from: `SeatDekho <${SENDER_EMAIL}>`,
      to: [booking.customerDetails.email],
      subject: `Booking Confirmed! Your Ticket for ${show.title} - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SeatDekho</h1>
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
                <td style="padding: 6px 0; color: #111827; text-align: right;">${show.venue}${show.address ? `, ${show.address}` : ''}</td>
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
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #6b7280; font-weight: bold; text-transform: uppercase;">SCAN THIS CODE AT THE ENTRANCE GATE</p>
            <div style="display: inline-block; width: 180px; height: 180px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; text-align: center;">
              <img src="cid:qrcode" alt="Entry QR Ticket" style="width: 170px; height: 170px; margin-top: 5px;" />
            </div>
            <p style="margin: 10px 0 0 0; font-size: 10px; color: #9ca3af;">Please show this email/QR code on your smartphone at the ticket box office check-in.</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center;">
            <p style="margin: 0 0 5px 0;">Need assistance? Contact our helpline at +91 79 2658 8900.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SeatDekho Platform. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(mailOptions)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    console.log(`Confirmation email sent successfully via Resend. Message ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Failed to send confirmation email via Resend:', error.message);
    return null;
  }
};

export const sendOTPEmail = async (email, otp) => {
  if (!RESEND_API_KEY) {
    console.warn('[RESEND WARNING] RESEND_API_KEY is not defined. Email will not be sent.');
    console.log(`[CRITICAL BYPASS] OTP for ${email} is ${otp}`);
    return null;
  }

  try {
    const mailOptions = {
      from: `SeatDekho <${SENDER_EMAIL}>`,
      to: [email],
      subject: `SeatDekho - OTP Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SeatDekho</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">OTP Verification Code</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #374151; font-weight: bold;">Hello,</p>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.6;">You are attempting to register or log in to SeatDekho. Please use the following One-Time Password (OTP) to complete the verification process.</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: 950; letter-spacing: 4px; color: #b91c1c;">${otp}</span>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center;">
            <p style="margin: 0 0 5px 0;">If you did not request this verification code, please ignore this email.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SeatDekho Platform. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(mailOptions)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }

    console.log(`OTP email sent successfully via Resend. Message ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Failed to send OTP email via Resend:', error.message);
    console.log(`[CRITICAL BYPASS] OTP for ${email} is ${otp}`);
    return null;
  }
};
