import { Queue } from 'bullmq';
import { getRedisConnectionConfig, isQueueEnabled } from './email-queue.js';

export const FEED_QUEUE_NAME = 'feed-queue';

let feedQueueInstance = null;

/**
 * Gets or initializes the BullMQ Feed Queue instance
 */
export function getFeedQueue() {
  if (!isQueueEnabled()) {
    return null;
  }

  if (!feedQueueInstance) {
    try {
      const connection = getRedisConnectionConfig();
      feedQueueInstance = new Queue(FEED_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000
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
      console.log(`[FEED QUEUE] BullMQ Queue "${FEED_QUEUE_NAME}" initialized successfully.`);
    } catch (err) {
      console.error('[FEED QUEUE] Failed to initialize BullMQ queue:', err);
      feedQueueInstance = null;
    }
  }

  return feedQueueInstance;
}

/**
 * Enqueues a feed post for background moderation and AI Agent mention triggering
 */
export async function enqueueFeedPostJob({ postId, schoolId, authorRole, fallbackProcessor }) {
  try {
    const queue = getFeedQueue();
    if (queue) {
      console.log(`📥 [FEED QUEUE] Enqueueing post moderation/AI job for Post ID: ${postId}`);
      const job = await queue.add('process-feed-post', {
        postId,
        schoolId,
        authorRole,
        enqueuedAt: new Date().toISOString()
      }, {
        jobId: `feed-post-${postId}`
      });
      return { enqueued: true, jobId: job.id };
    }
  } catch (err) {
    console.warn(`[FEED QUEUE ENQUEUE WARNING] Failed to enqueue to Redis, falling back to local background execution:`, err.message);
  }

  // Local async fallback if queue/Redis is not running
  if (typeof fallbackProcessor === 'function') {
    setImmediate(() => {
      fallbackProcessor(postId).catch(err => {
        console.error(`[FEED POST LOCAL PROCESS ERROR] Post ID: ${postId}:`, err);
      });
    });
  }

  return { enqueued: false, fallback: true };
}

/**
 * Enqueues a feed comment for background moderation and AI Agent mention triggering
 */
export async function enqueueFeedCommentJob({ commentId, postId, schoolId, authorRole, fallbackProcessor }) {
  try {
    const queue = getFeedQueue();
    if (queue) {
      console.log(`📥 [FEED QUEUE] Enqueueing comment moderation/AI job for Comment ID: ${commentId}`);
      const job = await queue.add('process-feed-comment', {
        commentId,
        postId,
        schoolId,
        authorRole,
        enqueuedAt: new Date().toISOString()
      }, {
        jobId: `feed-comment-${commentId}`
      });
      return { enqueued: true, jobId: job.id };
    }
  } catch (err) {
    console.warn(`[FEED QUEUE ENQUEUE WARNING] Failed to enqueue to Redis, falling back to local background execution:`, err.message);
  }

  // Local async fallback if queue/Redis is not running
  if (typeof fallbackProcessor === 'function') {
    setImmediate(() => {
      fallbackProcessor(commentId).catch(err => {
        console.error(`[FEED COMMENT LOCAL PROCESS ERROR] Comment ID: ${commentId}:`, err);
      });
    });
  }

  return { enqueued: false, fallback: true };
}
