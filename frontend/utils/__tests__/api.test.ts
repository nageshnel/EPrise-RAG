import { getGatewayUrl, getAuthToken, authFetch } from '../api';

describe('api utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);
  });

  describe('getGatewayUrl', () => {
    it('should return default URL if not saved in localStorage', () => {
      expect(getGatewayUrl()).toBe('http://localhost:8080');
    });

    it('should return saved URL from localStorage', () => {
      window.localStorage.setItem('eprise_gatewayUrl', 'https://api.mygateway.com ');
      expect(getGatewayUrl()).toBe('https://api.mygateway.com');
    });
  });

  describe('getAuthToken', () => {
    it('should return null if no token is saved', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should return saved token from localStorage', () => {
      window.localStorage.setItem('eprise_auth_token', 'my-secret-token');
      expect(getAuthToken()).toBe('my-secret-token');
    });
  });

  describe('authFetch', () => {
    it('should inject Content-Type and fetch correct full URL', async () => {
      await authFetch('/test-endpoint', { method: 'GET' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );

      const headersCall = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headersCall.get('Content-Type')).toBe('application/json');
      expect(headersCall.get('Authorization')).toBeNull();
    });

    it('should inject Authorization header if token is present', async () => {
      window.localStorage.setItem('eprise_auth_token', 'secret-jwt');
      await authFetch('another/endpoint', { method: 'POST', body: JSON.stringify({ a: 1 }) });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/another/endpoint',
        expect.objectContaining({
          method: 'POST',
        })
      );

      const headersCall = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headersCall.get('Authorization')).toBe('Bearer secret-jwt');
    });

    it('should not overwrite existing Content-Type header or inject it for FormData', async () => {
      const formData = new FormData();
      await authFetch('/upload', { method: 'POST', body: formData });

      const headersCall = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headersCall.get('Content-Type')).toBeNull(); // fetch handles boundaries for FormData
    });
  });
});
