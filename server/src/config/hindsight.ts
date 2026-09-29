import { HindsightClient } from '@vectorize-io/hindsight-client';
import { logger } from '../utils/logger.js';

export interface HindsightConfig {
  apiUrl: string;
  apiKey?: string;
  bankId: string;
  isConfigured: boolean;
}

export const hindsightConfig: HindsightConfig = {
  get apiUrl() {
    return process.env.HINDSIGHT_API_URL?.trim() || 'https://api.hindsight.vectorize.io';
  },
  get apiKey() {
    return process.env.HINDSIGHT_API_KEY?.trim() || undefined;
  },
  get bankId() {
    return process.env.HINDSIGHT_BANK_ID?.trim() || 'incident-memory-agent-prod';
  },
  get isConfigured() {
    return Boolean(process.env.HINDSIGHT_API_KEY?.trim() || process.env.HINDSIGHT_API_URL?.includes('localhost'));
  },
};

let clientInstance: HindsightClient | null = null;

export function getHindsightClient(): HindsightClient | null {
  if (!clientInstance && hindsightConfig.isConfigured) {
    try {
      clientInstance = new HindsightClient({
        baseUrl: hindsightConfig.apiUrl,
        apiKey: hindsightConfig.apiKey,
      });
      logger.info('Hindsight client initialized', {
        apiUrl: hindsightConfig.apiUrl,
        bankId: hindsightConfig.bankId,
      });
    } catch (err: any) {
      logger.error('Failed to instantiate Hindsight client', { error: err.message });
      return null;
    }
  }
  return clientInstance;
}
