import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter, usePathname } from 'expo-router';
import Sidebar from '../Sidebar';
import { AuthUser } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

describe('Sidebar', () => {
  const mockUser: AuthUser = {
    id: 'admin-id',
    name: 'Admin User',
    email: 'admin@v76.com',
    role: 'ADMIN',
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '◈', shortName: 'DB', roles: ['USER', 'ADMIN'] as any },
    { name: 'RAG Chat', path: '/chat', icon: '◎', shortName: 'Chat', roles: ['USER', 'ADMIN'] as any },
  ];

  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
    useThemeStore.setState({ mode: 'dark' });
  });

  it('should render menu items and user info when expanded', () => {
    const { getByText } = render(
      <Sidebar
        user={mockUser}
        navItems={navItems}
        collapsed={false}
        onToggle={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    // Sidebar logo text
    expect(getByText('EPRISE.AIRAG')).toBeTruthy();
    expect(getByText('Admin User')).toBeTruthy();
    expect(getByText('admin@v76.com')).toBeTruthy();

    // Nav items
    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('RAG Chat')).toBeTruthy();
  });

  it('should call router.push when menu item is clicked', () => {
    const { getByText } = render(
      <Sidebar
        user={mockUser}
        navItems={navItems}
        collapsed={false}
        onToggle={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    const chatItem = getByText('RAG Chat');
    fireEvent.press(chatItem);

    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('should display collapse styling when collapsed is true', () => {
    const { queryByText, getByText } = render(
      <Sidebar
        user={mockUser}
        navItems={navItems}
        collapsed={true}
        onToggle={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    // Menu text labels should be hidden
    expect(queryByText('EPRISE.AIRAG')).toBeNull();
    expect(queryByText('Dashboard')).toBeNull();
    
    // Admin emoji icon should be visible in collapsed mode
    expect(getByText('👑')).toBeTruthy();
  });

  it('should trigger onLogout callback when sign out button is pressed', () => {
    const onLogout = jest.fn();
    const { getByText } = render(
      <Sidebar
        user={mockUser}
        navItems={navItems}
        collapsed={false}
        onToggle={jest.fn()}
        onLogout={onLogout}
      />
    );

    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
