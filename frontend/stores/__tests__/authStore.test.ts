import { useAuthStore } from '../authStore';
import { decodeJwt } from '../../utils/jwt';

jest.mock('../../utils/jwt', () => ({
  decodeJwt: jest.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('should have initial guest state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should login successfully with valid credentials and save session', async () => {
    const mockUserDecoded = { sub: 'alice@v76.com', role: 'ADMIN' };
    (decodeJwt as jest.Mock).mockReturnValue(mockUserDecoded);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: 'mock-jwt-token', expiresInMs: 3600000 }),
    } as any);

    const result = await useAuthStore.getState().login('alice@v76.com', 'password123');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toEqual({
      id: 'alice@v76.com',
      name: 'alice',
      email: 'alice@v76.com',
      role: 'ADMIN',
    });
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();

    expect(window.localStorage.getItem('gems_auth_token')).toBe('mock-jwt-token');
    expect(JSON.parse(window.localStorage.getItem('gems_auth_session') || '{}')).toEqual({
      id: 'alice@v76.com',
      name: 'alice',
      email: 'alice@v76.com',
      role: 'ADMIN',
    });
  });

  it('should fail login when response is not ok (e.g. 401 Unauthorized)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as any);

    const result = await useAuthStore.getState().login('alice@v76.com', 'wrongpassword');

    expect(result).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid email or password. Please try again.');
  });

  it('should fail login on generic server error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'Internal Server Error' }),
    } as any);

    const result = await useAuthStore.getState().login('alice@v76.com', 'password');

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe('Internal Server Error');
  });

  it('should handle network connection exceptions gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down'));

    const result = await useAuthStore.getState().login('alice@v76.com', 'password');

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe('Connection error. Please verify the gateway server is running.');
  });

  it('should clear user session on logout', () => {
    window.localStorage.setItem('gems_auth_token', 'token');
    window.localStorage.setItem('gems_auth_session', '{}');
    useAuthStore.setState({ user: { id: '1', name: 'Bob', email: 'b@b.com', role: 'USER' } });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(window.localStorage.getItem('gems_auth_token')).toBeNull();
    expect(window.localStorage.getItem('gems_auth_session')).toBeNull();
  });

  it('should restore session from localStorage', () => {
    const savedUser = { id: 'alice@v76.com', name: 'alice', email: 'alice@v76.com', role: 'ADMIN' };
    window.localStorage.setItem('gems_auth_token', 'token');
    window.localStorage.setItem('gems_auth_session', JSON.stringify(savedUser));

    useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().user).toEqual(savedUser);
  });
});
