import { describe, it, expect } from 'vitest';
import { JwtAuthService } from './JwtAuthService';

describe('JwtAuthService', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
  
  it('should successfully decode valid JWT payload', () => {
    const payload = JwtAuthService.decodeToken(validToken);
    expect(payload).not.toBeNull();
    expect(payload?.name).toBe('John Doe');
    expect(payload?.admin).toBe(true);
    expect(payload?.sub).toBe('1234567890');
    expect(payload?.iat).toBe(1516239022);
  });

  it('should return null when decoding malformed JWTs', () => {
    expect(JwtAuthService.decodeToken('invalidToken')).toBeNull();
    expect(JwtAuthService.decodeToken('part1.part2')).toBeNull();
    expect(JwtAuthService.decodeToken('part1.part2.part3.part4')).toBeNull();
  });

  it('should verify signature successfully with correct secret key', async () => {
    const isSignatureValid = await JwtAuthService.verifySignature(validToken, 'a-string-secret-at-least-256-bits-long');
    expect(isSignatureValid).toBe(true);
  });

  it('should reject signature verification with wrong secret key', async () => {
    const isSignatureValid = await JwtAuthService.verifySignature(validToken, 'secret');
    expect(isSignatureValid).toBe(false);
  });

  it('should reject signature verification on tampered data', async () => {
    const parts = validToken.split('.');
    // Tamper the payload (e.g. change admin from true to false)
    const tamperedPayload = btoa(JSON.stringify({
      sub: '1234567890',
      name: 'John Doe',
      admin: false,
      iat: 1516239022
    })).replace(/=/g, '');
    
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const isSignatureValid = await JwtAuthService.verifySignature(tamperedToken, 'secret');
    expect(isSignatureValid).toBe(false);
  });
});
