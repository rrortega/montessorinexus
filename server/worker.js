import 'dotenv/config';
import { Worker } from 'bullmq';
import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';
const { Pool } = pgPkg;

import { QUEUE_NAME, getRedisConnectionConfig } from './email-queue.js';
import { KYC_QUEUE_NAME } from './kyc-queue.js';
import { detectFaceInDocumentImage } from './kyc-service.js';
import { scrapeCurp } from './curp-scraper.js';
import {
  processNewsletterDispatch,
  processNewsletterTest,
  processAdmissionOtpEmail,
  processStageTransitionNotifications
} from './email-service.js';

console.log('====================================================');
console.log('🚀 Ceiba Roots - Headless Queue Workers Starting...');
console.log(`🕒 Started at: ${new Date().toISOString()}`);
console.log(`📌 Process PID: ${process.pid}`);
console.log('====================================================');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ FATAL: DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
prisma.admissionStage = prisma.processStage;
prisma.admissionApplication = prisma.processApplication;
prisma.admissionFormTemplate = prisma.processFormTemplate;

const redisConnection = getRedisConnectionConfig();
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

console.log(`🔌 Redis Target: ${process.env.REDIS_URL || `${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`}`);
console.log(`⚙️  Workers Concurrency: ${concurrency} jobs in parallel`);

// 1. Email Worker Instance
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const startTime = Date.now();
    console.log(`\n📨 [EMAIL JOB START] Processing Job ID: ${job.id} | Name: ${job.name} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 1})`);

    try {
      await job.log(`[START] Processing email job: ${job.name}`);
      let result;
      switch (job.name) {
        case 'dispatch-newsletter': {
          const { newsletterId } = job.data;
          await job.log(`Dispatching newsletter ID: ${newsletterId}`);
          result = await processNewsletterDispatch(newsletterId, prisma);
          break;
        }

        case 'newsletter-test': {
          const { newsletterId, testEmail, schoolId } = job.data;
          await job.log(`Sending newsletter test to: ${testEmail}`);
          result = await processNewsletterTest({ newsletterId, testEmail, schoolId }, prisma);
          break;
        }

        case 'admission-otp': {
          const { tutorEmail } = job.data;
          await job.log(`Sending OTP email to: ${tutorEmail}`);
          result = await processAdmissionOtpEmail(job.data, prisma);
          break;
        }

        case 'stage-notification': {
          const { applicationId, toStageId } = job.data;
          await job.log(`Sending stage transition notification for application ${applicationId} to stage ${toStageId}`);
          result = await processStageTransitionNotifications(job.data, prisma);
          break;
        }

        default: {
          console.warn(`⚠️ [EMAIL JOB UNKNOWN] Unrecognized job name: ${job.name}`);
          await job.log(`⚠️ Unrecognized job name: ${job.name}`);
          result = { skipped: true, reason: 'Unknown job name' };
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [EMAIL JOB COMPLETED] Job ID: ${job.id} | Name: ${job.name} | Duration: ${duration}ms`);
      await job.log(`[SUCCESS] Email job completed in ${duration}ms`);
      return result;
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`❌ [EMAIL JOB FAILED] Job ID: ${job.id} | Name: ${job.name} | Error: ${err.message} | Duration: ${duration}ms`);
      await job.log(`[ERROR] Job failed: ${err.message}\nStack:\n${err.stack}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency
  }
);

worker.on('ready', () => {
  console.log(`🟢 [EMAIL WORKER READY] BullMQ Email Worker is listening on queue "${QUEUE_NAME}"...`);
});

worker.on('error', (err) => {
  console.error('🔴 [EMAIL WORKER ERROR] BullMQ Worker runtime error:', err);
});

worker.on('failed', (job, err) => {
  console.error(`💥 [EMAIL JOB ERROR] Job ${job?.id} failed: ${err.message}`);
});


// 2. KYC Face Detection Worker Instance
const kycWorker = new Worker(
  KYC_QUEUE_NAME,
  async (job) => {
    const startTime = Date.now();
    console.log(`\n🔍 [KYC JOB START] Processing Job ID: ${job.id} | Name: ${job.name}`);
    await job.log(`[START] Processing KYC job: ${job.name}`);
    try {
      if (job.name === 'detect-face') {
        const { jobId, imageBase64 } = job.data;
        await job.log(`Running face detection for job ${jobId}`);
        const result = await detectFaceInDocumentImage(imageBase64);
        await job.log(`Face detection result: hasFace=${result.hasFace}, faceTooLarge=${result.faceTooLarge}`);
        
        // Publish result to Deepstream HTTP API
        const deepstreamUrl = process.env.DEEPSTREAM_URL || 'https://realtime.asistenxa.com/api';
        const payload = {
          body: [
            {
              topic: "event",
              action: "emit",
              eventName: `kyc-face-result:${jobId}`,
              data: {
                jobId,
                hasFace: result.hasFace,
                faceTooLarge: result.faceTooLarge
              }
            }
          ]
        };

        try {
          await job.log(`Publishing face result to Deepstream event kyc-face-result:${jobId}`);
          const dsResponse = await fetch(deepstreamUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const responseText = await dsResponse.text();
          console.log(`📡 [DEEPSTREAM] Published event to ${deepstreamUrl}. Status: ${dsResponse.status}. Response: ${responseText}`);
          await job.log(`Deepstream response: ${dsResponse.status} - ${responseText}`);
        } catch (dsErr) {
          console.error(`❌ [DEEPSTREAM ERROR] Failed to send event to Deepstream:`, dsErr);
          await job.log(`[DEEPSTREAM ERROR] Failed to publish event: ${dsErr.message}`);
        }

        const duration = Date.now() - startTime;
        await job.log(`[SUCCESS] Face detection completed in ${duration}ms`);
        return result;
      } else if (job.name === 'verify-curp') {
        const { jobId, curp } = job.data;
        await job.log(`Starting CURP official verification for CURP: ${curp}`);

        let earlyEmitted = false;
        const deepstreamUrl = process.env.DEEPSTREAM_URL || 'https://realtime.asistenxa.com/api';

        const publishToDeepstream = async (success, details, error, isEarly = false) => {
          // Keep Deepstream payload lightweight (do not send heavy binary buffers through websocket)
          const cleanDetails = details ? { ...details } : null;
          if (cleanDetails && cleanDetails.pdfBase64) {
            cleanDetails.hasPdf = true;
            delete cleanDetails.pdfBase64;
          }

          const payload = {
            body: [
              {
                topic: "event",
                action: "emit",
                eventName: `kyc-curp-result:${jobId}`,
                data: {
                  jobId,
                  curp,
                  success,
                  details: cleanDetails,
                  error
                }
              }
            ]
          };

          try {
            await job.log(`Publishing CURP ${isEarly ? 'FAST' : 'FINAL'} result to Deepstream event kyc-curp-result:${jobId}`);
            const dsResponse = await fetch(deepstreamUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const responseText = await dsResponse.text();
            console.log(`📡 [DEEPSTREAM] Published CURP ${isEarly ? 'FAST' : 'FINAL'} event to ${deepstreamUrl}. Status: ${dsResponse.status}. Response: ${responseText}`);
            await job.log(`Deepstream response: ${dsResponse.status} - ${responseText}`);
          } catch (dsErr) {
            console.error(`❌ [DEEPSTREAM ERROR] Failed to send CURP event to Deepstream:`, dsErr);
            await job.log(`[DEEPSTREAM ERROR] Failed to publish CURP event: ${dsErr.message}`);
          }
        };

        const result = await scrapeCurp(curp, {
          onDataExtracted: async (fastData) => {
            earlyEmitted = true;
            console.log(`⚡ [CURP WORKER] Instant citizen data extracted! Notifying frontend without waiting for PDF...`);
            await publishToDeepstream(true, { ...fastData, status: 'VERIFICADO_OFICIAL' }, null, true);
          }
        });

        await job.log(`Scraper result: success=${result.success}`);
        if (result.data) {
          const logData = { ...result.data };
          if (logData.pdfBase64) logData.pdfBase64 = `[BASE64_LEN_${logData.pdfBase64.length}]`;
          await job.log(`Scraped details: ${JSON.stringify(logData)}`);
        }
        if (result.error) {
          await job.log(`Scraper warning/error: ${result.error}`);
        }

        // Store PDF Base64 in Redis with 1-hour TTL (Key: curp:pdf:CURP)
        if (result.data?.pdfBase64) {
          try {
            await redisConnection.set(`curp:pdf:${curp.toUpperCase()}`, result.data.pdfBase64, 'EX', 3600);
            console.log(`💾 [REDIS] Stored official CURP PDF Base64 in Redis (Key: curp:pdf:${curp.toUpperCase()}, TTL: 1 hour, Length: ${result.data.pdfBase64.length})`);
          } catch (rErr) {
            console.warn('[REDIS ERROR] Failed to save CURP PDF to Redis:', rErr.message);
          }
        }

        // Publish final event to Deepstream
        if (!earlyEmitted || !result.success || result.data?.pdfBase64) {
          await publishToDeepstream(result.success, result.data, result.error, false);
        }

        const duration = Date.now() - startTime;
        await job.log(`[SUCCESS] CURP verification completed in ${duration}ms`);
        return result;
      }
    } catch (err) {
      console.error(`❌ [KYC JOB FAILED] Job ID: ${job.id} | Name: ${job.name} | Error: ${err.message}`);
      await job.log(`[ERROR] Job failed: ${err.message}\nStack:\n${err.stack}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency
  }
);

kycWorker.on('ready', () => {
  console.log(`🟢 [KYC WORKER READY] BullMQ KYC Worker is listening on queue "${KYC_QUEUE_NAME}"...`);
});

kycWorker.on('error', (err) => {
  console.error('🔴 [KYC WORKER ERROR] BullMQ Worker runtime error:', err);
});

kycWorker.on('failed', (job, err) => {
  console.error(`💥 [KYC JOB ERROR] Job ${job?.id} failed: ${err.message}`);
});


// Graceful shutdown handling
let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Gracefully stopping all queue workers...`);
  try {
    await worker.close();
    await kycWorker.close();
    console.log('🔒 BullMQ Workers closed.');
    await prisma.$disconnect();
    try {
      await pool.end();
    } catch {
      // ignore
    }
    console.log('🔒 Database connections closed.');
    console.log('👋 Workers shutdown completed cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('⚠️ Error during workers shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
