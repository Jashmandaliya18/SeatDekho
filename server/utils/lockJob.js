import Seat from '../models/Seat.js';

export const startLockReleaseJob = () => {
  console.log('[LockCleaner] Expired seat lock release worker initialized.');
  
  
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredSeats = await Seat.find({
        status: 'locked',
        lockExpiresAt: { $lt: now }
      });

      if (expiredSeats.length > 0) {
        const seatIds = expiredSeats.map(s => s._id);
        
        
        await Seat.updateMany(
          { _id: { $in: seatIds } },
          {
            $set: { 
              status: 'available', 
              lockedBy: null, 
              bookingId: null 
            },
            $unset: { 
              lockExpiresAt: 1, 
              lockedAt: 1 
            }
          }
        );
        console.log(`[LockCleaner] Successfully released ${expiredSeats.length} expired seat locks.`);
      }
    } catch (error) {
      console.error('[LockCleaner] Error in background cleaner job:', error);
    }
  }, 15000);
};
