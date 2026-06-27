import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Settings from '../settings';
import { useThemeStore } from '../../stores/themeStore';

describe('Settings Screen', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'dark' });
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('should render sections list and input fields with default values', () => {
    const { getByPlaceholderText, getByText } = render(<Settings />);

    // Check service endpoints section fields exist
    expect(getByText('API Gateway URL')).toBeTruthy();
    expect(getByPlaceholderText('http://localhost:8080')).toBeTruthy();
  });

  it('should restore configuration values from localStorage', () => {
    // Set storage BEFORE rendering — Settings reads it in useEffect on mount
    window.localStorage.setItem('gems_gatewayUrl', 'https://gateway.internal.net');

    const { getByPlaceholderText } = render(<Settings />);

    const gatewayInput = getByPlaceholderText('http://localhost:8080');
    expect(gatewayInput.props.value).toBe('https://gateway.internal.net');
  });

  it('should save configured values to localStorage when Save Settings is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(<Settings />);

    const gatewayInput = getByPlaceholderText('http://localhost:8080');
    fireEvent.changeText(gatewayInput, 'http://custom-gateway.io:9000');

    const saveButton = getByText('Save Configuration');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(window.localStorage.getItem('gems_gatewayUrl')).toBe('http://custom-gateway.io:9000');
    expect(getByText('Configuration Saved')).toBeTruthy();
  });

  it('should navigate between settings categories when clicking tabs', () => {
    const { getByText, queryByText, getAllByText } = render(<Settings />);

    // Defaults to Section 0 (Service Endpoints) being visible
    expect(getByText('API Gateway URL')).toBeTruthy();

    // Click Category: AI Model Configuration
    // 'AI Model Configuration' appears in both the nav sidebar and the Configuration Overview
    // table, so use getAllByText and press the first one (nav button)
    const modelCategoryTab = getAllByText('AI Model Configuration')[0];
    fireEvent.press(modelCategoryTab);

    // AI model inputs should be visible, Service Endpoints should not be visible anymore
    expect(getByText('Embedding Model ID')).toBeTruthy();
    expect(queryByText('API Gateway URL')).toBeNull();
  });
});
