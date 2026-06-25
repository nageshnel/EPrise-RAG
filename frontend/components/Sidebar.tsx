import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { AuthUser, UserRole } from '../stores/authStore';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  shortName: string;
  roles: UserRole[];
}

interface SidebarProps {
  user: AuthUser;
  navItems: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

interface RoleBadgeStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export default function Sidebar({ user, navItems, collapsed, onToggle, onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const W_EXPANDED = 260;
  const W_COLLAPSED = 64;
  const sidebarWidth = collapsed ? W_COLLAPSED : W_EXPANDED;

  const roleBadge: RoleBadgeStyle = user.role === 'ADMIN'
    ? { label: 'ADMIN', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' }
    : { label: 'USER',  color: '#60a5fa', bg: 'rgba(37,99,235,0.15)',  border: 'rgba(37,99,235,0.3)' };

  return (
    <View style={{
      width: sidebarWidth, minWidth: sidebarWidth,
      backgroundColor: 'rgba(10,10,26,0.95)',
      borderRightWidth: 1,
      borderRightColor: 'rgba(255,255,255,0.06)',
      flexDirection: 'column',
      justifyContent: 'space-between',
      // Smooth width transition via CSS on web
      ...(typeof document !== 'undefined' ? { transition: 'width 0.25s ease, min-width 0.25s ease' } as any : {}),
    }}>

      {/* ═══ Top section ═══ */}
      <View style={{ overflow: 'hidden' }}>

        {/* ── Logo + Toggle ── */}
        <View style={{
          paddingHorizontal: collapsed ? 12 : 24,
          paddingVertical: collapsed ? 16 : 28,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
          marginBottom: 8,
          flexDirection: 'row', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {collapsed ? (
            /* Collapsed: just the icon */
            <Pressable onPress={onToggle} style={{ alignItems: 'center' }}>
              <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: 'rgba(124,58,237,0.2)',
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18, color: '#a78bfa' }}>⬡</Text>
              </View>
            </Pressable>
          ) : (
            /* Expanded: logo + collapse button */
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: 'rgba(124,58,237,0.2)',
                  borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 18, color: '#a78bfa' }}>⬡</Text>
                </View>
                <View>
                  <Text style={{ color: '#f1f5f9', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
                    GEMS<Text style={{ color: '#8b5cf6' }}>.</Text>AIRAG
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, marginTop: 1 }}>
                    RAG GATEWAY
                  </Text>
                </View>
              </View>
              {/* Collapse toggle button */}
              <Pressable
                onPress={onToggle}
                style={({ pressed }) => ({
                  width: 28, height: 28, borderRadius: 7,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                })}
              >
                <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>◂</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Section label ── */}
        {!collapsed && (
          <Text style={{
            color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700',
            paddingHorizontal: 24, paddingVertical: 8, marginTop: 4,
          }}>
            NAVIGATION
          </Text>
        )}

        {/* ── Nav items ── */}
        <View style={{ paddingHorizontal: collapsed ? 8 : 12, marginTop: collapsed ? 8 : 0 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={[{
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  paddingHorizontal: collapsed ? 0 : 14,
                  paddingVertical: collapsed ? 10 : 12,
                  borderRadius: 10, marginBottom: 2,
                },
                isActive ? {
                  backgroundColor: 'rgba(124,58,237,0.12)',
                  ...(collapsed ? {} : { borderLeftWidth: 2, borderLeftColor: '#7c3aed', paddingLeft: 12 }),
                } : {
                  backgroundColor: 'transparent',
                }]}
              >
                {/* Icon: always visible */}
                <View style={collapsed && isActive ? {
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: 'rgba(124,58,237,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                } : {
                  width: collapsed ? 36 : undefined, height: collapsed ? 36 : undefined,
                  borderRadius: collapsed ? 10 : 0,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: collapsed ? 0 : 12,
                }}>
                  <Text style={{
                    fontSize: collapsed ? 18 : 16,
                    color: isActive ? '#a78bfa' : '#475569',
                  }}>{item.icon}</Text>
                </View>

                {/* Label: only when expanded */}
                {!collapsed && (
                  <>
                    <Text style={{
                      fontSize: 13, fontWeight: isActive ? '600' : '500',
                      color: isActive ? '#e2d9fe' : '#64748b',
                      letterSpacing: 0.2,
                    }}>{item.name}</Text>
                    {isActive && (
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: '#7c3aed',
                        }} />
                      </View>
                    )}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── SkyWalking status (admin + expanded only) ── */}
        {user.role === 'ADMIN' && !collapsed && (
          <View style={{
            marginHorizontal: 12, marginTop: 20,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
            paddingTop: 16,
          }}>
            <Text style={{
              color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700',
              paddingHorizontal: 12, paddingBottom: 8,
            }}>
              OBSERVABILITY
            </Text>
            <View style={{
              borderRadius: 10,
              backgroundColor: 'rgba(6,182,212,0.06)',
              borderWidth: 1, borderColor: 'rgba(6,182,212,0.12)',
              padding: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 8 }} />
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>SkyWalking OAP</Text>
              </View>
              <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>Connected</Text>
              <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>oap:11800 · grpc active</Text>
            </View>
          </View>
        )}

        {/* SkyWalking: collapsed mini-indicator (admin only) */}
        {user.role === 'ADMIN' && collapsed && (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: 'rgba(6,182,212,0.08)',
              borderWidth: 1, borderColor: 'rgba(6,182,212,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
            </View>
          </View>
        )}
      </View>

      {/* ═══ Bottom section ═══ */}
      <View>

        {/* ── User profile ── */}
        {collapsed ? (
          /* Collapsed: avatar only + logout icon */
          <View style={{ alignItems: 'center', paddingVertical: 12, gap: 10 }}>
            <Pressable
              onPress={onToggle}
              style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: roleBadge.bg,
                borderWidth: 1, borderColor: roleBadge.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, color: roleBadge.color }}>
                {user.role === 'ADMIN' ? '👑' : '👤'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onLogout}
              style={({ pressed }) => ({
                width: 38, height: 38, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: pressed ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)',
              })}
            >
              <Text style={{ color: '#64748b', fontSize: 14 }}>⏻</Text>
            </Pressable>
          </View>
        ) : (
          /* Expanded: full profile card */
          <View style={{
            marginHorizontal: 12, marginBottom: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 12, padding: 14,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: roleBadge.bg,
                borderWidth: 1, borderColor: roleBadge.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 14, color: roleBadge.color }}>
                  {user.role === 'ADMIN' ? '👑' : '👤'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={{ color: '#475569', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                backgroundColor: roleBadge.bg,
                borderWidth: 1, borderColor: roleBadge.border,
              }}>
                <Text style={{ color: roleBadge.color, fontSize: 9, fontWeight: '700' }}>
                  {roleBadge.label}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onLogout}
              style={({ pressed }) => ({
                paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                backgroundColor: pressed ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: pressed ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
              })}
            >
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>Sign Out</Text>
            </Pressable>
          </View>
        )}

        {/* ── Version bar ── */}
        <View style={{
          padding: collapsed ? 10 : 16, paddingTop: 12,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? 6 : 0,
        }}>
          {collapsed ? (
            <Text style={{ color: '#334155', fontSize: 9, fontWeight: '600' }}>v0.1</Text>
          ) : (
            <>
              <View>
                <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 1 }}>BUILD</Text>
                <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600' }}>v0.1.0-beta</Text>
              </View>
              <View style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                backgroundColor: 'rgba(124,58,237,0.1)',
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
              }}>
                <Text style={{ color: '#8b5cf6', fontSize: 10, fontWeight: '700' }}>POC</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
