import fetch from 'cross-fetch';
import { StoredCredential } from '../utils/database';
import logger from '../utils/logger';

const HIBP_API = 'https://haveibeenpwned.com/api/v3';

export async function isCredentialCompromised(credential: StoredCredential, apiKey?: string): Promise<boolean> {
  try {
    if (!apiKey) {
      logger.warn('HIBP API key not configured. Skipping live breach check.');
      return credential.breachStatus === 'compromised';
    }
    const response = await fetch(`${HIBP_API}/breachedaccount/${encodeURIComponent(credential.username)}`, {
      headers: {
        'hibp-api-key': apiKey,
        useragent: 'SentinelSecurityManager/2.0'
      }
    });
    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      logger.warn('HIBP API returned non-ok response %s', response.statusText);
      return credential.breachStatus === 'compromised';
    }
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    logger.error('Failed to query HIBP API', error);
    return credential.breachStatus === 'compromised';
  }
}
