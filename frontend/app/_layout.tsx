import "../global.css";
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, UserRole } from '../stores/authStore';
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

  const isWeb = Platform.OS === 'web';

  // ── Sidebar collapse state ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Derived state (unconditional — safe when user is null) ──
  const userRole = user?.role ?? 'USER';
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
  const isOnAllowedRoute = navItems.some(item => item.path === pathname);

  // ── ALL hooks must be above any early return ──

  // Restore session on mount
  useEffect(() => {
    restoreSession();
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
      <View style={{ flex: 1, backgroundColor: '#05050f' }}>
        <StatusBar style="light" />
        <LoginScreen />
      </View>
    );
  }

  const handleToggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#05050f' }}>
      <StatusBar style="light" />

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
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#05050f' }}>

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
            backgroundColor: 'rgba(10,10,26,0.98)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 20, paddingVertical: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: 'rgba(124,58,237,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#a78bfa', fontSize: 14 }}>⬡</Text>
              </View>
              <Text style={{ color: '#f1f5f9', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>
                GEMS<Text style={{ color: '#8b5cf6' }}>.</Text>AIRAG
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                backgroundColor: userRole === 'ADMIN' ? 'rgba(124,58,237,0.15)' : 'rgba(37,99,235,0.15)',
              }}>
                <Text style={{
                  color: userRole === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                  fontSize: 9, fontWeight: '700',
                }}>
                  {userRole}
                </Text>
              </View>
              <Pressable onPress={logout} style={{ padding: 4 }}>
                <Text style={{ color: '#475569', fontSize: 16 }}>⏻</Text>
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
            backgroundColor: 'rgba(10,10,26,0.98)',
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
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
                    backgroundColor: 'rgba(124,58,237,0.15)',
                  } : {}]}>
                    <Text style={{ fontSize: 17, color: isActive ? '#a78bfa' : '#475569' }}>
                      {item.icon}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 10, fontWeight: isActive ? '700' : '500', marginTop: 2,
                    color: isActive ? '#a78bfa' : '#475569',
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
