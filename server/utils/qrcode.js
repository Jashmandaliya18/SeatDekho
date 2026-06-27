import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const generateQRCodeForBooking = async (booking) => {
  try {
    const payload = {
      bookingId: booking.bookingId,
      showId: booking.show.toString(),
      seats: booking.seats,
      customerName: booking.customerDetails.name,
      totalAmount: booking.totalAmount
    };

    
    const encryptedToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    
    const qrCodeDataUrl = await QRCode.toDataURL(encryptedToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR Code for ticket:', error);
    throw new Error('QR code generation failed.');
  }
};
