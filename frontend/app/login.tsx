import React, { useState } from 'react';
import { Text, View, TextInput, Pressable, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    await login(email, password);
  };

  const handleQuickLogin = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@gems.ai');
      setPassword('admin123');
    } else {
      setEmail('user@gems.ai');
      setPassword('user123');
    }
  };

  return (
    <View style={{
      flex: 1, backgroundColor: '#05050f',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Aurora glow background (web only) */}
      {Platform.OS === 'web' && (
        <>
          <View style={{
            position: 'absolute', top: -120, left: -120,
            width: 500, height: 500, borderRadius: 250,
            backgroundColor: 'rgba(124,58,237,0.08)',
          } as any} />
          <View style={{
            position: 'absolute', bottom: -100, right: -100,
            width: 400, height: 400, borderRadius: 200,
            backgroundColor: 'rgba(37,99,235,0.06)',
          } as any} />
          <View style={{
            position: 'absolute', top: '30%', right: '20%',
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: 'rgba(6,182,212,0.04)',
          } as any} />
        </>
      )}

      <ScrollView
        contentContainerStyle={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 24, paddingVertical: 40,
          minHeight: '100%',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + Branding */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          {/* Logo icon */}
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: 'rgba(124,58,237,0.15)',
            borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Text style={{ fontSize: 34, color: '#a78bfa' }}>⬡</Text>
          </View>

          <Text style={{
            color: '#f1f5f9', fontWeight: '800', fontSize: 28,
            letterSpacing: -0.5, textAlign: 'center',
          }}>
            GEMS<Text style={{ color: '#8b5cf6' }}>.</Text>AIRAG
          </Text>
          <Text style={{
            color: '#475569', fontSize: 12, letterSpacing: 3,
            fontWeight: '600', marginTop: 6, textAlign: 'center',
          }}>
            RAG GATEWAY PLATFORM
          </Text>
          <Text style={{
            color: '#334155', fontSize: 12, marginTop: 12,
            textAlign: 'center', maxWidth: 320, lineHeight: 18,
          }}>
            Enterprise cognitive retrieval and AI reasoning orchestrator with SkyWalking telemetry
          </Text>
        </View>

        {/* Login Card */}
        <View style={{
          width: '100%', maxWidth: 400,
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 24, padding: 32,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        }}>
          {/* Card header */}
          <Text style={{
            color: '#f1f5f9', fontWeight: '700', fontSize: 18,
            marginBottom: 4,
          }}>Sign In</Text>
          <Text style={{
            color: '#475569', fontSize: 12, marginBottom: 28,
          }}>Enter your credentials to access the platform</Text>

          {/* Error message */}
          {error && (
            <View style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
              borderRadius: 12, padding: 12,
              flexDirection: 'row', alignItems: 'center', gap: 10,
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 14 }}>⚠</Text>
              <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '500', flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Email field */}
          <View style={{ marginBottom: 18 }}>
            <Text style={{
              color: '#94a3b8', fontSize: 11, fontWeight: '600',
              marginBottom: 8, letterSpacing: 0.3,
            }}>Email Address</Text>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 14, borderWidth: 1,
              borderColor: focusedField === 'email'
                ? 'rgba(124,58,237,0.5)'
                : 'rgba(255,255,255,0.08)',
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Text style={{ color: '#475569', fontSize: 16, marginRight: 10 }}>✉</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@gems.ai"
                placeholderTextColor="#334155"
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => {/* focus password */}}
                style={{
                  flex: 1, paddingVertical: 14,
                  color: '#e2e8f0', fontSize: 13,
                } as any}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: '#94a3b8', fontSize: 11, fontWeight: '600',
              marginBottom: 8, letterSpacing: 0.3,
            }}>Password</Text>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 14, borderWidth: 1,
              borderColor: focusedField === 'password'
                ? 'rgba(124,58,237,0.5)'
                : 'rgba(255,255,255,0.08)',
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Text style={{ color: '#475569', fontSize: 16, marginRight: 10 }}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#334155"
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={handleLogin}
                style={{
                  flex: 1, paddingVertical: 14,
                  color: '#e2e8f0', fontSize: 13,
                } as any}
              />
              <Pressable onPress={() => setShowPassword(s => !s)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 14, color: '#475569' }}>
                  {showPassword ? '🙈' : '👁'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Login button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password.trim()}
            style={({ pressed }) => ({
              paddingVertical: 16, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 10,
              backgroundColor: '#7c3aed',
              opacity: (isLoading || !email.trim() || !password.trim()) ? 0.5 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  Authenticating…
                </Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                Sign In
              </Text>
            )}
          </Pressable>
        </View>

        {/* Quick access cards */}
        <View style={{ width: '100%', maxWidth: 400, marginTop: 24 }}>
          <Text style={{
            color: '#334155', fontSize: 10, letterSpacing: 2,
            fontWeight: '700', marginBottom: 12, textAlign: 'center',
          }}>
            DEMO CREDENTIALS
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Admin quick card */}
            <Pressable
              onPress={() => handleQuickLogin('admin')}
              style={({ pressed }) => ({
                flex: 1, borderRadius: 16, padding: 16,
                backgroundColor: pressed ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: pressed ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 8,
                  backgroundColor: 'rgba(124,58,237,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14 }}>👑</Text>
                </View>
                <View style={{
                  paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: 'rgba(124,58,237,0.15)',
                }}>
                  <Text style={{ color: '#a78bfa', fontSize: 9, fontWeight: '700' }}>ADMIN</Text>
                </View>
              </View>
              <Text style={{ color: '#c4b5fd', fontSize: 11, fontWeight: '600' }}>admin@gems.ai</Text>
              <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>Full platform access</Text>
              <Text style={{ color: '#475569', fontSize: 10, marginTop: 8, fontFamily: 'monospace' }}>
                pw: admin123
              </Text>
            </Pressable>

            {/* User quick card */}
            <Pressable
              onPress={() => handleQuickLogin('user')}
              style={({ pressed }) => ({
                flex: 1, borderRadius: 16, padding: 16,
                backgroundColor: pressed ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: pressed ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.06)',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 8,
                  backgroundColor: 'rgba(37,99,235,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                </View>
                <View style={{
                  paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: 'rgba(37,99,235,0.15)',
                }}>
                  <Text style={{ color: '#60a5fa', fontSize: 9, fontWeight: '700' }}>USER</Text>
                </View>
              </View>
              <Text style={{ color: '#93c5fd', fontSize: 11, fontWeight: '600' }}>user@gems.ai</Text>
              <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>Chat inference only</Text>
              <Text style={{ color: '#475569', fontSize: 10, marginTop: 8, fontFamily: 'monospace' }}>
                pw: user123
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: '#1e293b', fontSize: 10 }}>
            GEMS AIRAG Platform · v0.1.0-beta · © 2026
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
