/**
 * TOTP (Time-based One-Time Password) RFC 6238 Implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 TOTP secret key
 */
export function generateTotpSecret(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[bytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string into a Uint8Array
 */
function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

/**
 * Calculates standard 6-digit TOTP token for a given counter value
 */
async function generateHOTP(secretBytes: Uint8Array, counter: number): Promise<string> {
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // High 32-bits
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  // Low 32-bits
  counterView.setUint32(4, counter & 0xffffffff, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const signatureBytes = new Uint8Array(signature);

  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a secret with window tolerance (+-1 step = 30s)
 */
export async function verifyTotpToken(secret: string, token: string, timeStepSeconds = 30): Promise<boolean> {
  if (!secret || !token) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;

  try {
    const secretBytes = base32ToUint8Array(secret);
    const now = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(now / timeStepSeconds);

    // Check current step, previous step (-30s), and next step (+30s) for clock drift
    for (let stepOffset of [0, -1, 1]) {
      const generated = await generateHOTP(secretBytes, currentStep + stepOffset);
      if (generated === cleanToken) {
        return true;
      }
    }
  } catch (e) {
    console.error('Error verifying TOTP:', e);
  }
  return false;
}

/**
 * Generates an otpauth:// URI for QR code generators
 */
export function getTotpUri(userEmail: string, secret: string, issuer = 'CeibaRoots'): string {
  const cleanIssuer = encodeURIComponent(issuer);
  const cleanEmail = encodeURIComponent(userEmail);
  return `otpauth://totp/${cleanIssuer}:${cleanEmail}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates emergency backup recovery codes
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
    }
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Storage helpers for user TOTP settings
 */
export interface UserTotpConfig {
  enabled: boolean;
  secret: string;
  activatedAt?: string;
  backupCodes: string[];
}

export function getUserTotpConfig(userEmail: string): UserTotpConfig {
  const key = `ceiba_totp_${userEmail.trim().toLowerCase()}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    enabled: false,
    secret: '',
    backupCodes: []
  };
}

export function saveUserTotpConfig(userEmail: string, config: UserTotpConfig): void {
  const key = `ceiba_totp_${userEmail.trim().toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(config));
}

export function removeUserTotpConfig(userEmail: string): void {
  const key = `ceiba_totp_${userEmail.trim().toLowerCase()}`;
  localStorage.removeItem(key);
}
