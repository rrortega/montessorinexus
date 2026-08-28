import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  processNewsletterDispatch,
  processNewsletterTest,
  processAdmissionOtpEmail,
  processStageTransitionNotifications
} from './email-service.js';

export const QUEUE_NAME = 'email-queue';

/**
 * Checks if BullMQ queue should be used based on environment variables
 */
export function isQueueEnabled() {
  const envVal = (process.env.USE_EMAIL_QUEUE || '').toLowerCase().trim();
  if (envVal === 'true' || envVal === '1') return true;
  if (envVal === 'false' || envVal === '0') return false;
  // If not explicitly defined, enabled in production if REDIS_URL is provided
  return process.env.NODE_ENV === 'production' && !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Creates or retrieves Redis connection configuration
 */
export function getRedisConnectionConfig() {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
  };
}

let queueInstance = null;

/**
 * Gets or initializes the BullMQ Email Queue instance
 */
export function getEmailQueue() {
  if (!isQueueEnabled()) {
    return null;
  }

  if (!queueInstance) {
    try {
      const connection = getRedisConnectionConfig();
      queueInstance = new Queue(QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: {
            age: 24 * 3600, // keep 24 hours
            count: 1000
          },
          removeOnFail: {
            age: 7 * 24 * 3600 // keep 7 days
          }
        }
      });
      console.log(`[EMAIL QUEUE] BullMQ Queue "${QUEUE_NAME}" initialized successfully.`);
    } catch (err) {
      console.error('[EMAIL QUEUE] Failed to initialize BullMQ queue, falling back to direct mode:', err);
      queueInstance = null;
    }
  }

  return queueInstance;
}

/**
 * Enqueues or directly processes a newsletter dispatch
 */
export async function dispatchNewsletterJob(newsletterId, prisma) {
  const queue = getEmailQueue();
  if (queue) {
    console.log(`[EMAIL QUEUE] Enqueueing newsletter dispatch ID: ${newsletterId}`);
    const job = await queue.add('dispatch-newsletter', { newsletterId }, {
      jobId: `newsletter-${newsletterId}-${Date.now()}`
    });
    return { enqueued: true, jobId: job.id };
  }

  // Development / direct in-process mode
  console.log(`[EMAIL QUEUE] Direct dispatch (Queue disabled) for newsletter ID: ${newsletterId}`);
  // Run asynchronously in background without blocking caller
  setImmediate(() => {
    processNewsletterDispatch(newsletterId, prisma).catch(err => {
      console.error(`[EMAIL QUEUE DIRECT] Error processing newsletter ${newsletterId}:`, err);
    });
  });
  return { enqueued: false, direct: true };
}

/**
 * Enqueues or directly processes a newsletter test email
 */
export async function sendNewsletterTestJob({ newsletterId, testEmail, schoolId }, prisma) {
  const queue = getEmailQueue();
  if (queue) {
    console.log(`[EMAIL QUEUE] Enqueueing test newsletter to ${testEmail}`);
    const job = await queue.add('newsletter-test', { newsletterId, testEmail, schoolId });
    return { enqueued: true, jobId: job.id };
  }

  console.log(`[EMAIL QUEUE] Direct test send (Queue disabled) to ${testEmail}`);
  return await processNewsletterTest({ newsletterId, testEmail, schoolId }, prisma);
}

/**
 * Enqueues or directly processes an admission portal OTP email
 */
export async function sendAdmissionOtpJob({ schoolId, tutorEmail, tutorName, childName, code, token }, prisma) {
  const queue = getEmailQueue();
  if (queue) {
    console.log(`[EMAIL QUEUE] Enqueueing admission OTP to ${tutorEmail}`);
    const job = await queue.add('admission-otp', {
      schoolId,
      tutorEmail,
      tutorName,
      childName,
      code,
      token
    }, {
      priority: 1, // Higher priority for transactional OTP
      attempts: 2
    });
    return { enqueued: true, jobId: job.id };
  }

  console.log(`[EMAIL QUEUE] Direct admission OTP send (Queue disabled) to ${tutorEmail}`);
  return await processAdmissionOtpEmail({
    schoolId,
    tutorEmail,
    tutorName,
    childName,
    code,
    token
  }, prisma);
}

/**
 * Enqueues or directly processes stage transition notification emails
 */
export async function sendStageNotificationJob({ applicationId, fromStageId, toStageId, transitionType }, prisma) {
  const queue = getEmailQueue();
  if (queue) {
    console.log(`[EMAIL QUEUE] Enqueueing stage notification for app: ${applicationId} (${fromStageId} -> ${toStageId}, Type: ${transitionType})`);
    const job = await queue.add('stage-notification', {
      applicationId,
      fromStageId,
      toStageId,
      transitionType
    }, {
      attempts: 3
    });
    return { enqueued: true, jobId: job.id };
  }

  console.log(`[EMAIL QUEUE] Direct stage notification send (Queue disabled) for app: ${applicationId}`);
  setImmediate(() => {
    processStageTransitionNotifications({ applicationId, fromStageId, toStageId, transitionType }, prisma).catch(err => {
      console.error(`[EMAIL QUEUE DIRECT] Error processing stage notification for app ${applicationId}:`, err);
    });
  });
  return { enqueued: false, direct: true };
}
