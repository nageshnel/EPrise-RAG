import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import LoginScreen from '../login';
import { useAuthStore } from '../../stores/authStore';

// We mock the authStore hook
jest.mock('../../stores/authStore', () => {
  const loginMock = jest.fn();
  return {
    useAuthStore: jest.fn().mockImplementation(() => ({
      login: loginMock,
      isLoading: false,
      error: null,
    })),
  };
});

describe('LoginScreen', () => {
  let loginMock: jest.Mock;

  beforeEach(() => {
    loginMock = jest.fn();
    (useAuthStore as any).mockImplementation(() => ({
      login: loginMock,
      isLoading: false,
      error: null,
    }));
  });

  it('should render username, password fields and sign in button', () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('admin@gems.ai')).toBeTruthy();
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    expect(getAllByText('Sign In').length).toBe(2);
  });

  it('should trigger login request when form is submitted with values', async () => {
    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('admin@gems.ai');
    const passwordInput = getByPlaceholderText('Enter password');
    const submitButton = getAllByText('Sign In')[1];

    fireEvent.changeText(emailInput, 'test@gems.ai');
    fireEvent.changeText(passwordInput, 'mypassword');
    
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(loginMock).toHaveBeenCalledWith('test@gems.ai', 'mypassword');
  });

  it('should display error alert if auth error is returned', () => {
    (useAuthStore as any).mockImplementation(() => ({
      login: loginMock,
      isLoading: false,
      error: 'Invalid credentials',
    }));

    const { getByText } = render(<LoginScreen />);
    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('should display authenticating activity indicator when loading', () => {
    (useAuthStore as any).mockImplementation(() => ({
      login: loginMock,
      isLoading: true,
      error: null,
    }));

    const { getByText } = render(<LoginScreen />);
    expect(getByText('Authenticating…')).toBeTruthy();
  });

  it('should autofill credentials when admin demo card is clicked', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const adminDemoCard = getByText('Full platform access');
    fireEvent.press(adminDemoCard);

    const emailInput = getByPlaceholderText('admin@gems.ai');
    const passwordInput = getByPlaceholderText('Enter password');

    expect(emailInput.props.value).toBe('admin@gems.ai');
    expect(passwordInput.props.value).toBe('admin123');
  });

  it('should autofill credentials when user demo card is clicked', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const userDemoCard = getByText('Chat inference only');
    fireEvent.press(userDemoCard);

    const emailInput = getByPlaceholderText('admin@gems.ai');
    const passwordInput = getByPlaceholderText('Enter password');

    expect(emailInput.props.value).toBe('user@gems.ai');
    expect(passwordInput.props.value).toBe('user123');
  });
});
