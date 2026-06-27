import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ChatPlayground from '../chat';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { xhr_sse_stream } from '../../utils/stream';

// Mock authStore
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: '1', name: 'Alice Cooper', email: 'alice@v76.com', role: 'ADMIN' },
  }),
}));

// Mock stream utility
jest.mock('../../utils/stream', () => ({
  xhr_sse_stream: jest.fn(),
}));

describe('ChatPlayground Screen', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'dark' });
    jest.clearAllMocks();
  });

  it('should render welcome message and list of suggested prompts', () => {
    const { getByText, getByPlaceholderText } = render(<ChatPlayground />);

    expect(getByText(/Hello Alice!/)).toBeTruthy();
    expect(getByText('What are the MFA requirements for admin users?')).toBeTruthy();
    expect(getByPlaceholderText('Ask anything about your documents…')).toBeTruthy();
  });

  it('should trigger stream connection and display query and answer when sending message', async () => {
    let mockOnEvent: any;
    (xhr_sse_stream as jest.Mock).mockImplementation(
      (path, payload, signal, onEvent) => {
        mockOnEvent = onEvent;
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText, queryByText } = render(<ChatPlayground />);

    const input = getByPlaceholderText('Ask anything about your documents…');
    fireEvent.changeText(input, 'What is MFA?');

    // Press Send
    const sendButton = getByText('↑');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    expect(xhr_sse_stream).toHaveBeenCalledWith(
      '/chat/stream',
      expect.objectContaining({ question: 'What is MFA?' }),
      expect.any(AbortSignal),
      expect.any(Function)
    );

    // Verify suggestion prompts are hidden after sending (showSuggestions=false)
    expect(queryByText('SUGGESTED QUERIES')).toBeNull();

    // Trigger SSE events
    await act(async () => {
      // 1. Sources event
      mockOnEvent('sources', [
        { sequence: 1, sourceType: 'DOCUMENT', metadata: { filename: 'security_policy.pdf' } }
      ]);
      // 2. Content event
      mockOnEvent('content', 'MFA is mandatory');
      mockOnEvent('content', ' for all admins.');
      // 3. Done event
      mockOnEvent('done', { tokens: 10 });
    });

    expect(getByText('MFA is mandatory for all admins.')).toBeTruthy();
    // CitationChip: source='security_policy.pdf:seq:1', short = source.split('/').pop().split(':')[0] = 'security_policy.pdf'
    expect(getByText('security_policy.pdf')).toBeTruthy();
  });

  it('should trigger send when suggested prompt is pressed', async () => {
    (xhr_sse_stream as jest.Mock).mockResolvedValue(undefined);

    const { getByText } = render(<ChatPlayground />);

    const suggestion = getByText('What are the MFA requirements for admin users?');
    await act(async () => {
      fireEvent.press(suggestion);
    });

    expect(xhr_sse_stream).toHaveBeenCalledWith(
      '/chat/stream',
      expect.objectContaining({ question: 'What are the MFA requirements for admin users?' }),
      expect.any(AbortSignal),
      expect.any(Function)
    );
  });
});
