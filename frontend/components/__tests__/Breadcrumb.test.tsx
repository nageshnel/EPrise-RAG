import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { usePathname } from 'expo-router';
import Breadcrumb from '../Breadcrumb';
import { AuthUser } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

describe('Breadcrumb', () => {
  const mockUser: AuthUser = {
    id: 'user-id',
    name: 'Alice Cooper',
    email: 'alice@v76.com',
    role: 'ADMIN',
  };

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
    useThemeStore.setState({ mode: 'dark' });
  });

  it('should render breadcrumb hierarchy and user info correctly', () => {
    const { getByText } = render(
      <Breadcrumb
        user={mockUser}
        sidebarCollapsed={false}
        onToggleSidebar={jest.fn()}
      />
    );

    // Platform > Dashboard for "/" path
    expect(getByText('Platform')).toBeTruthy();
    expect(getByText('Dashboard')).toBeTruthy();
    
    // User role badge and name
    expect(getByText('ADMIN')).toBeTruthy();
    expect(getByText('Alice Cooper')).toBeTruthy();
  });

  it('should adapt breadcrumb trail based on current pathname', () => {
    (usePathname as jest.Mock).mockReturnValue('/chat');

    const { getByText } = render(
      <Breadcrumb
        user={mockUser}
        sidebarCollapsed={false}
        onToggleSidebar={jest.fn()}
      />
    );

    expect(getByText('Playground')).toBeTruthy();
    expect(getByText('RAG Chat')).toBeTruthy();
  });

  it('should trigger sidebar toggle when collapsed button is pressed', () => {
    const onToggleSidebar = jest.fn();
    const { getByText } = render(
      <Breadcrumb
        user={mockUser}
        sidebarCollapsed={false}
        onToggleSidebar={onToggleSidebar}
      />
    );

    const toggleButton = getByText('◂'); // collapsed: false shows ◂
    fireEvent.press(toggleButton);

    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('should trigger theme toggle when theme button is pressed', () => {
    const toggleSpy = jest.spyOn(useThemeStore.getState(), 'toggle');
    const { getByText } = render(
      <Breadcrumb
        user={mockUser}
        sidebarCollapsed={false}
        onToggleSidebar={jest.fn()}
      />
    );

    const themeButton = getByText('☀️'); // dark mode displays sun icon to toggle to light
    fireEvent.press(themeButton);

    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });
});
