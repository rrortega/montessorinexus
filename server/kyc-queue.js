import { Queue } from 'bullmq';
import { getRedisConnectionConfig } from './email-queue.js';

export const KYC_QUEUE_NAME = 'kyc-queue';

let kycQueueInstance = null;

/**
 * Gets or initializes the BullMQ KYC Queue instance
 */
export function getKycQueue() {
  if (!kycQueueInstance) {
    try {
      const connection = getRedisConnectionConfig();
      kycQueueInstance = new Queue(KYC_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000
          },
          removeOnComplete: {
            age: 3600, // keep 1 hour
            count: 500
          },
          removeOnFail: {
            age: 24 * 3600 // keep 24 hours
          }
        }
      });
      console.log(`[KYC QUEUE] BullMQ Queue "${KYC_QUEUE_NAME}" initialized successfully.`);
    } catch (err) {
      console.error('[KYC QUEUE] Failed to initialize BullMQ queue:', err);
      kycQueueInstance = null;
    }
  }

  return kycQueueInstance;
}

/**
 * Enqueues a face detection job
 */
export async function enqueueFaceDetectionJob(jobId, imageBase64) {
  const queue = getKycQueue();
  if (queue) {
    console.log(`[KYC QUEUE] Enqueueing face detection job ID: ${jobId}`);
    const job = await queue.add('detect-face', { jobId, imageBase64 }, {
      jobId
    });
    return { enqueued: true, jobId: job.id };
  }
  
  throw new Error('KYC Queue is not initialized');
}

/**
 * Enqueues a CURP verification job
 */
export async function enqueueCurpVerificationJob(jobId, curp) {
  const queue = getKycQueue();
  if (queue) {
    console.log(`[KYC QUEUE] Enqueueing CURP verification job ID: ${jobId} for CURP: ${curp}`);
    const job = await queue.add('verify-curp', { jobId, curp }, {
      jobId
    });
    return { enqueued: true, jobId: job.id };
  }
  
  throw new Error('KYC Queue is not initialized');
}
