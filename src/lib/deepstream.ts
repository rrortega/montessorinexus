import { DeepstreamClient } from '@deepstream/client';

let clientInstance: any = null;

/**
 * Initializes and returns a singleton instance of the Deepstream client.
 * Connects anonymously via WebSockets using VITE_DEEPSTREAM_URL env.
 */
export function getDeepstreamClient() {
  if (clientInstance) return clientInstance;

  const url = import.meta.env.VITE_DEEPSTREAM_URL || 'wss://realtime.asistenxa.com';
  try {
    console.log(`[DEEPSTREAM] Connecting to ${url}...`);
    clientInstance = new DeepstreamClient(url);
    clientInstance.login(); // Connect with anonymous authentication
    
    clientInstance.on('error', (error: any, event: any, topic: any) => {
      console.warn('[DEEPSTREAM ERROR] Client encountered error:', error, event, topic);
    });

    clientInstance.on('connectionStateChanged', (state: string) => {
      console.log(`[DEEPSTREAM STATE] Connection state changed to: ${state}`);
    });
  } catch (err) {
    console.error('[DEEPSTREAM INIT ERROR] Failed to initialize client:', err);
  }

  return clientInstance;
}
