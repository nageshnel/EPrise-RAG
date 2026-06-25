import "../global.css";
import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  shortName: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard',       path: '/',          icon: '◈',  shortName: 'Home'    },
  { name: 'RAG Chat',        path: '/chat',      icon: '◎',  shortName: 'Chat'    },
  { name: 'Document Center', path: '/documents', icon: '⬡',  shortName: 'Docs'    },
  { name: 'Settings',        path: '/settings',  icon: '◇',  shortName: 'Config'  },
];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWeb = Platform.OS === 'web';

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#05050f' }}>
      <StatusBar style="light" />

      {/* ── DESKTOP SIDEBAR ── */}
      {isWeb && (
        <View style={{
          width: 260, minWidth: 260,
          backgroundColor: 'rgba(10,10,26,0.95)',
          borderRightWidth: 1,
          borderRightColor: 'rgba(255,255,255,0.06)',
          paddingTop: 0,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Logo area */}
          <View>
            <View style={{
              paddingHorizontal: 24, paddingVertical: 28,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
              marginBottom: 8,
            }}>
              {/* Logo mark */}
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
            </View>

            {/* Nav section label */}
            <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', paddingHorizontal: 24, paddingVertical: 8, marginTop: 4 }}>
              NAVIGATION
            </Text>

            {/* Nav items */}
            <View style={{ paddingHorizontal: 12 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Pressable
                    key={item.path}
                    onPress={() => router.push(item.path as any)}
                    style={[{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 12,
                      borderRadius: 10, marginBottom: 2,
                    },
                    isActive ? {
                      backgroundColor: 'rgba(124,58,237,0.12)',
                      borderLeftWidth: 2, borderLeftColor: '#7c3aed',
                      paddingLeft: 12,
                    } : {
                      backgroundColor: 'transparent',
                    }]}
                  >
                    <Text style={{
                      fontSize: 16, marginRight: 12,
                      color: isActive ? '#a78bfa' : '#475569',
                    }}>{item.icon}</Text>
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
                  </Pressable>
                );
              })}
            </View>

            {/* Divider + SkyWalking section */}
            <View style={{
              marginHorizontal: 12, marginTop: 20,
              borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
              paddingTop: 16,
            }}>
              <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', paddingHorizontal: 12, paddingBottom: 8 }}>
                OBSERVABILITY
              </Text>
              <View style={{
                marginHorizontal: 0, borderRadius: 10,
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
          </View>

          {/* Bottom version info */}
          <View style={{
            padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
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
          </View>
        </View>
      )}

      {/* ── MAIN CONTENT ── */}
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#05050f' }}>

        {/* Mobile Top Bar */}
        {!isWeb && (
          <View style={{
            backgroundColor: 'rgba(10,10,26,0.98)',
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 20, paddingVertical: 16,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
              <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '600' }}>Live</Text>
            </View>
          </View>
        )}

        {/* Page Content */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>

        {/* Mobile Bottom Navigation */}
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
