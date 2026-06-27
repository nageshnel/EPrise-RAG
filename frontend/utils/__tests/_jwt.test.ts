import { decodeJwt } from '../jwt';

describe('decodeJwt', () => {
  it('should successfully decode valid JWT payload', () => {
    // Standard test JWT: header.payload.signature
    // Payload: {"sub": "alice", "role": "ADMIN", "exp": 1719420000}
    const payloadObj = { sub: 'alice', role: 'ADMIN', exp: 1719420000 };
    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64')
      .replace(/=/g, '');
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;

    const result = decodeJwt(token);
    expect(result).toEqual(payloadObj);
  });

  it('should return null if token does not have 3 parts', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload';
    const result = decodeJwt(invalidToken);
    expect(result).toBeNull();
  });

  it('should return null and handle base64 decode errors gracefully', () => {
    const badToken = 'header.invalid_base64_payload_$$$.signature';
    const result = decodeJwt(badToken);
    expect(result).toBeNull();
  });
});
