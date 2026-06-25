import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { usePathname } from 'expo-router';
import { AuthUser } from '../stores/authStore';
import { useThemeStore, useThemeColors } from '../stores/themeStore';

interface BreadcrumbProps {
  user: AuthUser;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

/** Maps route paths to breadcrumb segments */
const ROUTE_META: Record<string, { label: string; parent: string; icon: string }> = {
  '/':          { label: 'Dashboard',       parent: 'Platform',       icon: '◈' },
  '/chat':      { label: 'RAG Chat',        parent: 'Playground',     icon: '◎' },
  '/documents': { label: 'Document Center', parent: 'Knowledge Base', icon: '⬡' },
  '/settings':  { label: 'Settings',        parent: 'Configuration',  icon: '◇' },
};

export default function Breadcrumb({ user, sidebarCollapsed, onToggleSidebar }: BreadcrumbProps) {
  const pathname = usePathname();
  const meta = ROUTE_META[pathname] ?? { label: 'Page', parent: 'Platform', icon: '◈' };

  const mode = useThemeStore((state) => state.mode);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const theme = useThemeColors();

  const roleBadge = user.role === 'ADMIN'
    ? (mode === 'dark'
      ? { label: 'ADMIN', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)' }
      : { label: 'ADMIN', color: '#1e40af', bg: 'rgba(59,130,246,0.1)' })
    : (mode === 'dark'
      ? { label: 'USER',  color: '#60a5fa', bg: 'rgba(37,99,235,0.12)' }
      : { label: 'USER',  color: '#2563eb', bg: 'rgba(37,99,235,0.08)' });

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: theme.border.default,
      backgroundColor: theme.nav.bg,
      // Smooth transitions for themes
      ...(typeof document !== 'undefined' ? { transition: 'background-color 0.25s ease, border-color 0.25s ease' } as any : {}),
    }}>
      {/* Left: toggle + breadcrumb path */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

        {/* Sidebar toggle */}
        <Pressable
          onPress={onToggleSidebar}
          style={({ pressed }) => ({
            width: 32, height: 32, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed 
              ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') 
              : (mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            borderWidth: 1, borderColor: theme.border.default,
          })}
        >
          <Text style={{ color: theme.text.secondary, fontSize: 14, fontWeight: '700' }}>
            {sidebarCollapsed ? '▸' : '◂'}
          </Text>
        </Pressable>

        {/* Separator */}
        <View style={{
          width: 1, height: 18,
          backgroundColor: theme.border.default,
        }} />

        {/* Breadcrumb trail */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Parent */}
          <Text style={{ color: theme.text.muted, fontSize: 11, fontWeight: '600' }}>
            {meta.parent}
          </Text>

          {/* Separator chevron */}
          <Text style={{ color: theme.text.muted, fontSize: 10 }}>/</Text>

          {/* Current page */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: theme.accent.primary, fontSize: 12 }}>{meta.icon}</Text>
            <Text style={{ color: theme.text.primary, fontSize: 12, fontWeight: '600' }}>
              {meta.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: role badge + user name + theme toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          backgroundColor: roleBadge.bg,
        }}>
          <Text style={{ color: roleBadge.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
            {roleBadge.label}
          </Text>
        </View>
        <Text style={{ color: theme.text.secondary, fontSize: 11, fontWeight: '500' }}>
          {user.name}
        </Text>

        {/* Separator */}
        <View style={{
          width: 1, height: 18,
          backgroundColor: theme.border.default,
        }} />

        {/* Theme toggle icon button */}
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => ({
            width: 32, height: 32, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed 
              ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') 
              : (mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            borderWidth: 1, borderColor: theme.border.default,
          })}
        >
          <Text style={{ fontSize: 13 }}>{mode === 'light' ? '🌙' : '☀️'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
