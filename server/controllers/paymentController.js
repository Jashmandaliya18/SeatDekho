import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Seat from '../models/Seat.js';
import Show from '../models/Show.js';
import Refund from '../models/Refund.js';
import razorpayInstance from '../config/razorpay.js';
import { generateQRCodeForBooking } from '../utils/qrcode.js';
import { sendConfirmationEmail } from '../utils/mailer.js';
import { runInTransaction } from '../utils/transaction.js';

const finalizeBooking = async (booking) => {
  let showRecord = null;

  await runInTransaction(async (session) => {
    await Seat.updateMany(
      { bookingId: booking._id },
      { $set: { status: 'booked' }, $unset: { lockExpiresAt: 1, lockedAt: 1 } },
      { session }
    );

    const show = await Show.findById(booking.show).session(session);
    showRecord = show;
    if (show) {
      const newSeats = booking.seats.filter(s => !show.bookedSeats.includes(s));
      if (newSeats.length > 0) {
        show.bookedSeats.push(...newSeats);
        await show.save({ session });
      }
    }

    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';

    try {
      const qrCodeUrl = await generateQRCodeForBooking(booking);
      booking.qrCodeUrl = qrCodeUrl;
    } catch (qrErr) {
      console.error('QR generation failed (non-critical):', qrErr.message);
    }

    await booking.save({ session });
  });

  try {
    if (showRecord) await sendConfirmationEmail(booking, showRecord);
  } catch (emailErr) {
    console.error('Email sending failed (non-critical):', emailErr.message);
  }

  return await Booking.findById(booking._id).populate('show');
};


export const createQRCode = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'Missing booking ID.' });
    }

    const booking = await Booking.findOne({ bookingId }).populate('show');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const show = booking.show;
    if (!show) {
      return res.status(404).json({ message: 'Show details not found.' });
    }

    // Compute payable amount server-side (show price * seats)
    let calculatedAmount = 0;
    for (const seatNumber of booking.seats) {
      const [rowName] = seatNumber.split('-');
      const rowInfo = show.layout.find(r => r.rowName === rowName);
      if (!rowInfo) {
        return res.status(400).json({ message: `Invalid seat row: ${seatNumber}` });
      }
      const categoryPrice = show.categories.find(c => c.name === rowInfo.category)?.price;
      if (categoryPrice === undefined) {
        return res.status(400).json({ message: `Price category not found for seat: ${seatNumber}` });
      }
      calculatedAmount += categoryPrice;
    }

    const amountInPaise = Math.round(calculatedAmount * 100);

    const qrResponse = await razorpayInstance.qrCode.create({
      type: 'upi_qr',
      name: 'SeatDekho Ticket',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amountInPaise,
      description: `Booking ${booking.bookingId}`,
      notes: {
        bookingId: booking._id.toString()
      }
    });

    res.status(200).json({
      imageUrl: qrResponse.image_url,
      qrCodeId: qrResponse.id
    });
  } catch (error) {
    console.error('QR Code Generation Failed:', error);
    res.status(500).json({ error: error.message, message: 'Failed to generate payment QR code.' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification parameters.' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Signature verification failed. Potential tampering.' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    if (booking.paymentStatus === 'paid') {
      const populatedBooking = await Booking.findById(booking._id).populate('show');
      return res.status(200).json({
        success: true,
        message: 'Booking is already confirmed.',
        booking: populatedBooking
      });
    }

    // Set Payment to paid and finalize Booking immediately for instant UX confirmation
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    const populatedBooking = await finalizeBooking(booking);

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message, message: 'Server error verifying payment.' });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).send('Webhook signature missing');
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    hmac.update(rawBody);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).send('Webhook signature verification failed');
    }

    const event = req.body.event;
    console.log(`Razorpay Webhook Event Received: ${event}`);

    // Respond 200 quickly to prevent retries
    res.status(200).json({ status: 'ok' });

    // Process event asynchronously in the background
    const bgPromise = (async () => {
      try {
        if (event === 'payment.captured' || event === 'order.paid') {
          const payload = req.body.payload.payment.entity;
          const razorpayOrderId = payload.order_id;
          const razorpayPaymentId = payload.id;
          const method = payload.method;

          let payment = null;
          if (razorpayOrderId) {
            payment = await Payment.findOne({ razorpayOrderId });
          }
          if (!payment && razorpayPaymentId) {
            payment = await Payment.findOne({ razorpayPaymentId });
          }

          // If no payment record found (e.g. UPI QR code dynamic payments), lookup booking via notes
          if (!payment && payload.notes?.bookingId) {
            const bookingIdObj = payload.notes.bookingId;
            const booking = await Booking.findById(bookingIdObj);
            if (booking) {
              payment = new Payment({
                bookingId: booking._id,
                razorpayOrderId: razorpayOrderId || `qr_${razorpayPaymentId}`,
                razorpayPaymentId: razorpayPaymentId,
                amount: payload.amount / 100, // Store in Rupees
                currency: payload.currency || 'INR',
                status: 'created'
              });
              await payment.save();
            }
          }

          if (!payment) {
            console.error(`No corresponding order/payment found for order: ${razorpayOrderId}, payment: ${razorpayPaymentId}`);
            return;
          }

          if (payment.status === 'paid') {
            console.log(`Payment ${payment._id} already marked as paid.`);
            if (method && !payment.method) {
              payment.method = method;
              await payment.save();
            }
            return;
          }

          payment.status = 'paid';
          payment.razorpayPaymentId = razorpayPaymentId;
          payment.method = method;
          await payment.save();

          const booking = await Booking.findById(payment.bookingId);
          if (booking && booking.paymentStatus !== 'paid') {
            await finalizeBooking(booking);
            console.log(`Webhook finalized booking: ${booking.bookingId}`);
          }
        }

        else if (event === 'payment.failed') {
          const payload = req.body.payload.payment.entity;
          const razorpayOrderId = payload.order_id;
          const razorpayPaymentId = payload.id;

          let payment = null;
          if (razorpayOrderId) {
            payment = await Payment.findOne({ razorpayOrderId });
          }
          if (!payment && razorpayPaymentId) {
            payment = await Payment.findOne({ razorpayPaymentId });
          }

          if (payment) {
            if (payment.status === 'failed') return;

            payment.status = 'failed';
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.errorDetails = payload.error_description || 'Payment failed';
            await payment.save();

            const booking = await Booking.findById(payment.bookingId);
            if (booking) {
              booking.paymentStatus = 'failed';
              booking.bookingStatus = 'cancelled';
              await booking.save();

              // Release seats
              await Seat.updateMany(
                { bookingId: booking._id },
                { 
                  $set: { status: 'available', lockedBy: null, bookingId: null }, 
                  $unset: { lockExpiresAt: 1, lockedAt: 1 } 
                }
              );

              // Update Show layout
              const show = await Show.findById(booking.show);
              if (show) {
                show.bookedSeats = show.bookedSeats.filter(s => !booking.seats.includes(s));
                await show.save();
              }

              console.log(`Webhook marked booking ${booking.bookingId} as failed and released seats.`);
              
              // Trigger automatic refund flow internally if any partial capture occurred
              if (payload.captured) {
                console.log(`Partial capture detected on failed payment ${razorpayPaymentId}. Triggering internal refund.`);
                await triggerInternalRefund(payment, payload.amount);
              }
            }
          }
        }

        else if (event === 'refund.processed') {
          const payload = req.body.payload.refund.entity;
          const refundId = payload.id;
          const paymentId = payload.payment_id;

          let refund = await Refund.findOne({ razorpayRefundId: refundId });
          if (!refund) {
            const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
            if (payment) {
              refund = new Refund({
                paymentId: payment._id,
                razorpayRefundId: refundId,
                amount: payload.amount,
                status: 'completed',
                reason: payload.notes?.reason || 'Refund processed via webhook'
              });
              await refund.save();
            }
          } else if (refund.status !== 'completed') {
            refund.status = 'completed';
            await refund.save();
          }

          if (refund) {
            const payment = await Payment.findById(refund.paymentId);
            if (payment) {
              payment.status = 'refunded';
              await payment.save();

              const booking = await Booking.findById(payment.bookingId);
              if (booking) {
                booking.paymentStatus = 'refunded';
                booking.bookingStatus = 'cancelled_refunded';
                await booking.save();

                // Release seats
                await Seat.updateMany(
                  { bookingId: booking._id },
                  { 
                    $set: { status: 'available', lockedBy: null, bookingId: null }, 
                    $unset: { lockExpiresAt: 1, lockedAt: 1 } 
                  }
                );

                const show = await Show.findById(booking.show);
                if (show) {
                  show.bookedSeats = show.bookedSeats.filter(
                    seat => !booking.seats.includes(seat)
                  );
                  await show.save();
                }

                console.log(`Webhook confirmed refund.processed for booking ${booking.bookingId}.`);
              }
            }
          }
        }

        else if (event === 'refund.failed') {
          const payload = req.body.payload.refund.entity;
          const refundId = payload.id;

          const refund = await Refund.findOne({ razorpayRefundId: refundId });
          if (refund) {
            refund.status = 'failed';
            await refund.save();
            console.error(`🚨 MANUAL OPS REVIEW REQUIRED: Razorpay Refund ${refundId} failed.`);
          }
        }
      } catch (innerErr) {
        console.error('Error processing webhook event payload:', innerErr);
      }
    })();

    return bgPromise;
  } catch (error) {
    console.error('Webhook handler error:', error);
    if (!res.headersSent) {
      res.status(500).send('Webhook server error');
    }
  }
};

const triggerInternalRefund = async (payment, amount) => {
  try {
    const refundResponse = await razorpayInstance.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: amount,
        notes: {
          bookingId: payment.bookingId.toString(),
          reason: 'Auto-refund triggered due to payment failure with partial capture'
        }
      }
    );

    const refund = new Refund({
      paymentId: payment._id,
      razorpayRefundId: refundResponse.id,
      amount: amount / 100, // Store in Rupees
      status: 'refund_initiated',
      reason: 'Auto-refund on partial capture'
    });
    await refund.save();

    payment.status = 'refund_initiated';
    payment.refundId = refundResponse.id;
    await payment.save();

    console.log(`Auto-refund initiated for payment ${payment.razorpayPaymentId}, refund ID: ${refundResponse.id}`);
  } catch (err) {
    console.error('Failed to trigger automatic refund:', err);
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(payment.amount * 100);

    const refundResponse = await razorpayInstance.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: refundAmount,
        notes: {
          bookingId: payment.bookingId.toString(),
          reason: reason || 'Manual refund'
        }
      }
    );

    const refund = new Refund({
      paymentId: payment._id,
      razorpayRefundId: refundResponse.id,
      amount: amount ? Number(amount) : payment.amount, // Store in Rupees
      status: 'refund_initiated',
      reason: reason || 'Manual refund'
    });
    await refund.save();

    payment.status = 'refund_initiated';
    payment.refundId = refundResponse.id;
    await payment.save();

    res.status(201).json({
      message: 'Refund initiated successfully.',
      refund
    });
  } catch (error) {
    console.error('Manual refund initiation failed:', error);
    res.status(500).json({ error: error.message, message: 'Failed to process refund.' });
  }
};

export const devConfirmPayment = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = new Payment({
        bookingId: booking._id,
        razorpayOrderId: `dev_order_${Math.random().toString(36).substr(2, 9)}`,
        razorpayPaymentId: `dev_pay_${Math.random().toString(36).substr(2, 9)}`,
        amount: booking.totalAmount,
        currency: 'INR',
        status: 'paid'
      });
    } else {
      payment.status = 'paid';
      payment.razorpayPaymentId = payment.razorpayPaymentId || `dev_pay_${Math.random().toString(36).substr(2, 9)}`;
    }
    await payment.save();

    const updatedBooking = await finalizeBooking(booking);
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
