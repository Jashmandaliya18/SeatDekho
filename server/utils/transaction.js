import mongoose from 'mongoose';

/**
 * Executes a callback within a MongoDB/Mongoose session transaction.
 * Automatically falls back to standard execution if the MongoDB deployment
 * does not support transactions (e.g., standalone local MongoDB server).
 * 
 * @param {Function} callback - Async function to run. Receives the `session` object.
 * @returns {Promise<any>} The result of the callback.
 */
export const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    const errorMessage = error.message || '';
    // Check if the error is due to transactions not being supported (e.g., standalone deployment)
    const isTransactionUnsupported = 
      errorMessage.includes('Replica Set member') ||
      errorMessage.includes('transaction') ||
      errorMessage.includes('sessions') ||
      errorMessage.includes('Transaction numbers');

    if (isTransactionUnsupported) {
      console.warn('MongoDB transaction not supported by this deployment. Falling back to non-transactional execution.');
      // Execute the callback without a session session
      return await callback(null);
    }

    // Otherwise, abort and propagate the real error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};
