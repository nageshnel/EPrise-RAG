import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { usePathname } from 'expo-router';
import { AuthUser } from '../stores/authStore';

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

  const roleBadge = user.role === 'ADMIN'
    ? { label: 'ADMIN', color: '#a78bfa', bg: 'rgba(124,58,237,0.12)' }
    : { label: 'USER',  color: '#60a5fa', bg: 'rgba(37,99,235,0.12)' };

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
      backgroundColor: 'rgba(10,10,26,0.6)',
    }}>
      {/* Left: toggle + breadcrumb path */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

        {/* Sidebar toggle */}
        <Pressable
          onPress={onToggleSidebar}
          style={({ pressed }) => ({
            width: 32, height: 32, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          })}
        >
          <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '700' }}>
            {sidebarCollapsed ? '▸' : '◂'}
          </Text>
        </Pressable>

        {/* Separator */}
        <View style={{
          width: 1, height: 18,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }} />

        {/* Breadcrumb trail */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Parent */}
          <Text style={{ color: '#334155', fontSize: 11, fontWeight: '600' }}>
            {meta.parent}
          </Text>

          {/* Separator chevron */}
          <Text style={{ color: '#1e293b', fontSize: 10 }}>/</Text>

          {/* Current page */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ color: '#475569', fontSize: 12 }}>{meta.icon}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
              {meta.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: role badge + user name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          backgroundColor: roleBadge.bg,
        }}>
          <Text style={{ color: roleBadge.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
            {roleBadge.label}
          </Text>
        </View>
        <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }}>
          {user.name}
        </Text>
      </View>
    </View>
  );
}
