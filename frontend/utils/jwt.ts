export function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decodedStr = new TextDecoder().decode(bytes);
    return JSON.parse(decodedStr);
  } catch (e) {
    console.error("JWT Decode error", e);
    return null;
  }
}
