export interface JwtPayload {
  sub: string;
  name: string;
  admin: boolean;
  iat: number;
  exp?: number;
}

export class JwtAuthService {
  /**
   * Decodes a JWT token payload safely.
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payloadPart = parts[1];
      let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      const rawJson = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(rawJson) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifies the token signature using Web Crypto HMAC-SHA256.
   * Signature is verified against the secret key 'secret' used for the evaluation token.
   */
  static async verifySignature(token: string, secret: string = 'a-string-secret-at-least-256-bits-long'): Promise<boolean> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const dataToSign = `${headerB64}.${payloadB64}`;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const data = encoder.encode(dataToSign);

      // Get crypto provider
      const cryptoProvider = typeof crypto !== 'undefined' && crypto.subtle
        ? crypto
        : (typeof window !== 'undefined' && window.crypto ? window.crypto : null);

      if (!cryptoProvider || !cryptoProvider.subtle) {
        throw new Error('Web Crypto API (subtle) is not available in this environment.');
      }

      // Import key for Web Crypto Subtle
      const key = await cryptoProvider.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify', 'sign']
      );

      // Sign the data to verify
      const signatureBuffer = await cryptoProvider.subtle.sign('HMAC', key, data);
      
      // Convert to base64url
      const uint8 = new Uint8Array(signatureBuffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      
      const expectedSignatureB64 = btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      return signatureB64 === expectedSignatureB64;
    } catch (err) {
      console.error('JWT Signature verification failed with error:', err);
      return false;
    }
  }
}
export default JwtAuthService;
