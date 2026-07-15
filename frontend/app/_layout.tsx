import "../global.css";
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, UserRole } from '../stores/authStore';
import { useThemeStore, useThemeColors } from '../stores/themeStore';
import LoginScreen from './login';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  shortName: string;
  roles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard',       path: '/',          icon: '◈',  shortName: 'Home',   roles: ['ADMIN']         },
  { name: 'RAG Chat',        path: '/chat',      icon: '◎',  shortName: 'Chat',   roles: ['ADMIN', 'USER'] },
  { name: 'Document Center', path: '/documents', icon: '⬡',  shortName: 'Docs',   roles: ['ADMIN']         },
  { name: 'Settings',        path: '/settings',  icon: '◇',  shortName: 'Config', roles: ['ADMIN']         },
];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, restoreSession } = useAuthStore();
  const { mode, restoreTheme } = useThemeStore();
  const theme = useThemeColors();

  const isWeb = Platform.OS === 'web';

  // ── Sidebar collapse state ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Derived state (unconditional — safe when user is null) ──
  const userRole = user?.role ?? 'USER';
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const isOnAllowedRoute = navItems.some(item => item.path === pathname);

  // ── ALL hooks must be above any early return ──

  // Restore session & theme on mount
  useEffect(() => {
    restoreSession();
    restoreTheme();
  }, []);

  // Redirect USER-role away from admin-only routes
  useEffect(() => {
    if (user && !isOnAllowedRoute && userRole === 'USER') {
      router.replace('/chat' as any);
    }
  }, [pathname, isOnAllowedRoute, userRole, user]);

  // ── NOT AUTHENTICATED → show Login screen ──
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.primary }}>
        <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        <LoginScreen />
      </View>
    );
  }

  const handleToggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // Role badges for mobile layout
  const mobileRoleBadge = userRole === 'ADMIN'
    ? (mode === 'dark'
      ? { color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' }
      : { color: '#1e40af', bg: 'rgba(59,130,246,0.15)' })
    : (mode === 'dark'
      ? { color: '#60a5fa', bg: 'rgba(37,99,235,0.15)' }
      : { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' });

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg.primary }}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />

      {/* ── DESKTOP SIDEBAR (collapsible) ── */}
      {isWeb && (
        <Sidebar
          user={user}
          navItems={navItems}
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
          onLogout={logout}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme.bg.primary }}>

        {/* ── Web: Breadcrumb top bar ── */}
        {isWeb && (
          <Breadcrumb
            user={user}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
          />
        )}

        {/* ── Mobile: Top bar ── */}
        {!isWeb && (
          <View style={{
            backgroundColor: theme.nav.bg,
            borderBottomWidth: 1, borderBottomColor: theme.border.default,
            paddingHorizontal: 20, paddingVertical: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: mode === 'dark' ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: theme.accent.primary, fontSize: 14 }}>⬡</Text>
              </View>
              <Text style={{ color: theme.text.primary, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>
                EPRISE<Text style={{ color: theme.accent.primary }}>.</Text>AIRAG
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                backgroundColor: mobileRoleBadge.bg,
              }}>
                <Text style={{
                  color: mobileRoleBadge.color,
                  fontSize: 9, fontWeight: '700',
                }}>
                  {userRole}
                </Text>
              </View>
              <Pressable onPress={logout} style={{ padding: 4 }}>
                <Text style={{ color: theme.text.secondary, fontSize: 16 }}>⏻</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Page content ── */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>

        {/* ── Mobile: Bottom navigation ── */}
        {!isWeb && (
          <View style={{
            backgroundColor: theme.nav.bg,
            borderTopWidth: 1, borderTopColor: theme.border.default,
            flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8,
          }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Pressable
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
                >
                  <View style={[{
                    width: 40, height: 36, borderRadius: 10,
                    alignItems: 'center', justifyContent: 'center',
                  }, isActive ? {
                    backgroundColor: theme.nav.active,
                  } : {}]}>
                    <Text style={{ fontSize: 17, color: isActive ? theme.accent.primary : theme.text.secondary }}>
                      {item.icon}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 10, fontWeight: isActive ? '700' : '500', marginTop: 2,
                    color: isActive ? theme.accent.primary : theme.text.secondary,
                    letterSpacing: 0.5,
                  }}>
                    {item.shortName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
