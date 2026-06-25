import React, { useState, useRef, useEffect } from 'react';
import { Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore, useThemeColors } from '../stores/themeStore';

interface Message {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  citations?: string[];
  latency?: number;
  tokens?: number;
  isStreaming?: boolean;
}

interface SuggestedPrompt {
  label: string;
  text: string;
  icon: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { icon: '🔐', label: 'Security Policy',   text: 'What are the MFA requirements for admin users?' },
  { icon: '📋', label: 'Compliance',        text: 'Summarize the TLS encryption standards in our policies.' },
  { icon: '⚡', label: 'Performance',       text: 'What are the SLA thresholds for the API gateway?' },
  { icon: '📊', label: 'Earnings Report',   text: 'Highlight key financial metrics from Q3 earnings.' },
];

function TypingIndicator() {
  const theme = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: theme.accent.primary, opacity: 0.6,
        }} />
      ))}
      <Text style={{ color: theme.text.muted, fontSize: 11, marginLeft: 6 }}>Retrieving context & reasoning…</Text>
    </View>
  );
}

function CitationChip({ source, index }: { source: string; index: number }) {
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();
  const short = source.split('/').pop()?.split(':')[0] ?? source;

  const chipColor = mode === 'dark' ? '#a78bfa' : '#1e40af';
  const chipText = mode === 'dark' ? '#8b5cf6' : '#2563eb';
  const chipBg = mode === 'dark' ? 'rgba(124,58,237,0.1)' : 'rgba(59,130,246,0.08)';
  const chipBorder = mode === 'dark' ? 'rgba(124,58,237,0.25)' : 'rgba(59,130,246,0.2)';

  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
      backgroundColor: chipBg,
      borderWidth: 1, borderColor: chipBorder,
      flexDirection: 'row', alignItems: 'center', gap: 5,
    }}>
      <Text style={{ color: chipColor, fontSize: 9, fontWeight: '700' }}>[{index + 1}]</Text>
      <Text style={{ color: chipText, fontSize: 10, fontWeight: '500' }}>{short}</Text>
    </View>
  );
}

interface ModelOption { id: string; label: string; badge: string; }
const MODELS: ModelOption[] = [
  { id: 'gpt-4o',      label: 'GPT-4o',        badge: 'OpenAI'      },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini',   badge: 'OpenAI'      },
  { id: 'llama-3-70b', label: 'Llama 3 · 70B', badge: 'Self-Hosted' },
  { id: 'mistral-7b',  label: 'Mistral 7B',    badge: 'Self-Hosted' },
];

export default function ChatPlayground() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const userName = user?.name?.split(' ')[0] ?? 'there';

  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'ASSISTANT',
      text: `Hello ${userName}! I'm your GEMS RAG Orchestrator. I can answer questions using context retrieved from your embedded documents. What would you like to explore?`,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(5);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('You are an enterprise AI assistant. Answer questions using only the retrieved document context provided. Always cite your sources.');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = (text?: string) => {
    const query = text ?? inputText;
    if (!query.trim() || isGenerating) return;
    setShowSuggestions(false);

    const userMsg: Message = { id: `u${Date.now()}`, sender: 'USER', text: query };
    const assistantId = `a${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      sender: 'ASSISTANT',
      text: '',
      citations: [
        'corporate_security_policy.pdf:L12-L28',
        'infrastructure/kubernetes/secrets.yaml:L4-L19',
        'q3_earnings_report.docx:L44',
      ],
      latency: Math.floor(Math.random() * 400) + 700,
      tokens: Math.floor(Math.random() * 300) + 200,
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputText('');
    setIsGenerating(true);

    const fullResponse = `Based on the retrieved context from your corporate security documentation, the policy mandates:\n\n**1. MFA Enforcement**: All admin and privileged users must use hardware-backed TOTP or FIDO2 keys. Software authenticators are permitted for standard users.\n\n**2. API Key Rotation**: All service API keys, including OpenAI tokens and gateway secrets, must be rotated every 90 days via the secrets management pipeline.\n\n**3. TLS Standards**: All intra-cluster service communication must use TLS 1.3. External-facing endpoints enforce TLS 1.2 as the minimum.`;

    let idx = 0;
    const chars = fullResponse.split('');

    const streamTimer = setInterval(() => {
      if (idx < chars.length) {
        const partial = chars.slice(0, idx + 3).join('');
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, text: partial, isStreaming: true } : m
        ));
        idx += 3;
      } else {
        clearInterval(streamTimer);
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, text: fullResponse, isStreaming: false } : m
        ));
        setIsGenerating(false);
      }
    }, 20);
  };

  const selectedModelObj = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg.primary }}>

      {/* ── MAIN CHAT PANE ── */}
      <View style={{ flex: 1, flexDirection: 'column' }}>

        {/* Chat Header */}
        <View style={{
          paddingHorizontal: 24, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: theme.border.default,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: theme.nav.bg,
        }}>
          <View>
            <Text style={{ color: theme.text.primary, fontSize: 15, fontWeight: '700' }}>RAG Chat Playground</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: mode === 'dark' ? '#4ade80' : '#10b981' }} />
              <Text style={{ color: theme.text.muted, fontSize: 11 }}>
                Model: <Text style={{ color: theme.accent.primary, fontWeight: '600' }}>{selectedModelObj.label}</Text>
                {'  '}·{'  '}
                TopK: <Text style={{ color: mode === 'dark' ? '#60a5fa' : '#2563eb', fontWeight: '600' }}>{topK} chunks</Text>
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setMessages([{ id: '0', sender: 'ASSISTANT', text: "Session cleared. Ready for a new conversation!" }]);
              setShowSuggestions(true);
            }}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
              backgroundColor: theme.bg.card,
              borderWidth: 1, borderColor: theme.border.default,
            }}
          >
            <Text style={{ color: theme.text.secondary, fontSize: 11, fontWeight: '600' }}>Clear Session</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Suggested prompts */}
          {showSuggestions && messages.length <= 1 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>
                SUGGESTED QUERIES
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleSend(p.text)}
                    style={({ pressed }) => [{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: pressed ? theme.nav.active : theme.bg.card,
                      borderWidth: 1, borderColor: theme.border.default,
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                    }]}
                  >
                    <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                    <View>
                      <Text style={{ color: theme.text.primary, fontSize: 11, fontWeight: '600' }}>{p.label}</Text>
                      <Text style={{ color: theme.text.secondary, fontSize: 10, marginTop: 1, maxWidth: 180 }} numberOfLines={1}>
                        {p.text}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Message thread */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                marginBottom: 16,
                alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
              }}
            >
              {/* Sender label */}
              <Text style={{
                fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
                color: msg.sender === 'USER' ? theme.accent.primary : theme.text.secondary,
                marginBottom: 5,
                alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
              }}>
                {msg.sender === 'USER' ? 'YOU' : '✦ GEMS RAG'}
              </Text>

              {/* Bubble */}
              <View style={[{
                borderRadius: 18, padding: 16,
              }, msg.sender === 'USER' ? {
                backgroundColor: mode === 'dark' ? 'rgba(124,58,237,0.18)' : 'rgba(59,130,246,0.12)',
                borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(124,58,237,0.3)' : 'rgba(59,130,246,0.25)',
                borderBottomRightRadius: 4,
              } : {
                backgroundColor: theme.bg.card,
                borderWidth: 1, borderColor: theme.border.default,
                borderBottomLeftRadius: 4,
              }]}>
                {msg.isStreaming && msg.text === '' ? (
                  <TypingIndicator />
                ) : (
                  <Text style={{
                    color: msg.sender === 'USER' 
                      ? (mode === 'dark' ? '#ddd6fe' : '#1e3a8a') 
                      : theme.text.primary,
                    fontSize: 13, lineHeight: 21,
                  }}>
                    {msg.text}
                  </Text>
                )}

                {msg.isStreaming && msg.text !== '' && (
                  <View style={{
                    width: 8, height: 16, backgroundColor: theme.accent.primary,
                    borderRadius: 1, marginTop: 2, opacity: 0.8,
                  }} />
                )}

                {/* Footer row */}
                {!msg.isStreaming && msg.citations && (
                  <View>
                    <View style={{
                      height: 1, backgroundColor: theme.border.default,
                      marginVertical: 10,
                    }} />
                    {/* Citations chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {msg.citations.map((c, i) => (
                        <CitationChip key={i} source={c} index={i} />
                      ))}
                    </View>
                    {/* Stats */}
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {msg.latency && (
                        <Text style={{ color: theme.text.muted, fontSize: 10, fontFamily: 'monospace' }}>
                          ⏱ {msg.latency}ms
                        </Text>
                      )}
                      {msg.tokens && (
                        <Text style={{ color: theme.text.muted, fontSize: 10, fontFamily: 'monospace' }}>
                          🪙 {msg.tokens} tokens
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Generating skeleton */}
          {isGenerating && messages[messages.length - 1]?.sender === 'ASSISTANT' && messages[messages.length - 1]?.text === '' && (
            <View style={{ alignSelf: 'flex-start', maxWidth: '60%', marginBottom: 16 }}>
              <View style={{
                padding: 16, borderRadius: 18, borderBottomLeftRadius: 4,
                backgroundColor: theme.bg.card,
                borderWidth: 1, borderColor: theme.border.default,
              }}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input Dock ── */}
        <View style={{
          borderTopWidth: 1, borderTopColor: theme.border.default,
          padding: 16,
          backgroundColor: theme.nav.bg,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', gap: 10,
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            borderRadius: 18, borderWidth: 1, borderColor: theme.border.default,
            paddingHorizontal: 16, paddingVertical: 10,
          }}>
            <TextInput
              placeholder="Ask anything about your documents…"
              placeholderTextColor={theme.text.muted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              multiline
              maxLength={2000}
              style={{
                flex: 1,
                color: theme.text.primary,
                fontSize: 13,
                maxHeight: 120,
                paddingVertical: 4,
              } as any}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={isGenerating || !inputText.trim()}
              style={({ pressed }) => [{
                width: 40, height: 40, borderRadius: 12,
                alignItems: 'center', justifyContent: 'center',
                opacity: (isGenerating || !inputText.trim()) ? 0.3 : 1,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                backgroundColor: theme.accent.primary,
              }]}
            >
              {isGenerating
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>↑</Text>
              }
            </Pressable>
          </View>
          <Text style={{ color: theme.text.muted, fontSize: 10, textAlign: 'center', marginTop: 6 }}>
            GEMS RAG · Context window: 16K · {topK} retrieved chunks · pgvector cosine similarity
          </Text>
        </View>
      </View>

      {/* ── CONFIG PANEL (web, right side) ── */}
      {Platform.OS === 'web' && isAdmin && (
        <View style={{
          width: 300,
          backgroundColor: theme.nav.bg,
          borderLeftWidth: 1, borderLeftColor: theme.border.default,
          padding: 20,
        }}>
          <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 13, marginBottom: 20, letterSpacing: 0.3 }}>
            Orchestrator Config
          </Text>

          {/* Model Select */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
              REASONING MODEL
            </Text>
            {MODELS.map(m => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedModel(m.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, marginBottom: 4,
                  backgroundColor: selectedModel === m.id ? theme.nav.active : (mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  borderWidth: 1,
                  borderColor: selectedModel === m.id ? (mode === 'dark' ? 'rgba(124,58,237,0.35)' : 'rgba(59,130,246,0.35)') : theme.border.default,
                }}
              >
                <Text style={{ 
                  color: selectedModel === m.id 
                    ? (mode === 'dark' ? '#c4b5fd' : '#1e40af') 
                    : theme.text.secondary, 
                  fontSize: 12, fontWeight: '500' 
                }}>
                  {m.label}
                </Text>
                <View style={{
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: selectedModel === m.id 
                    ? (mode === 'dark' ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.15)') 
                    : (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                }}>
                  <Text style={{ 
                    color: selectedModel === m.id 
                      ? theme.accent.primary 
                      : theme.text.muted, 
                    fontSize: 9, fontWeight: '600' 
                  }}>
                    {m.badge}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Temperature */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>TEMPERATURE</Text>
              <Text style={{ color: theme.accent.primary, fontSize: 11, fontWeight: '700', fontFamily: 'monospace' }}>
                {temperature.toFixed(1)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0.0, 0.3, 0.5, 0.7, 1.0].map(t => (
                <Pressable
                  key={t}
                  onPress={() => setTemperature(t)}
                  style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                    backgroundColor: temperature === t 
                      ? (mode === 'dark' ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.15)') 
                      : (mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    borderWidth: 1,
                    borderColor: temperature === t 
                      ? (mode === 'dark' ? 'rgba(124,58,237,0.4)' : 'rgba(59,130,246,0.35)') 
                      : theme.border.default,
                  }}
                >
                  <Text style={{ 
                    color: temperature === t 
                      ? (mode === 'dark' ? '#c4b5fd' : '#1e40af') 
                      : theme.text.secondary, 
                    fontSize: 10, fontWeight: '600' 
                  }}>
                    {t.toFixed(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: theme.text.muted, fontSize: 9 }}>Precise</Text>
              <Text style={{ color: theme.text.muted, fontSize: 9 }}>Creative</Text>
            </View>
          </View>

          {/* Top-K */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>TOP-K CHUNKS</Text>
              <Text style={{ color: mode === 'dark' ? '#60a5fa' : '#2563eb', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' }}>k={topK}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[2, 3, 5, 8, 10].map(k => (
                <Pressable
                  key={k}
                  onPress={() => setTopK(k)}
                  style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                    backgroundColor: topK === k 
                      ? (mode === 'dark' ? 'rgba(37,99,235,0.2)' : 'rgba(59,130,246,0.15)') 
                      : (mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    borderWidth: 1,
                    borderColor: topK === k 
                      ? (mode === 'dark' ? 'rgba(37,99,235,0.4)' : 'rgba(59,130,246,0.35)') 
                      : theme.border.default,
                  }}
                >
                  <Text style={{ 
                    color: topK === k 
                      ? (mode === 'dark' ? '#93c5fd' : '#1e40af') 
                      : theme.text.secondary, 
                    fontSize: 10, fontWeight: '600' 
                  }}>{k}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* System prompt */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
              SYSTEM DIRECTIVE
            </Text>
            <TextInput
              multiline
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              style={{
                backgroundColor: theme.bg.card,
                borderWidth: 1, borderColor: theme.border.default,
                borderRadius: 10, padding: 12,
                color: theme.text.secondary, fontSize: 11, lineHeight: 16,
                minHeight: 90,
              } as any}
            />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: theme.border.default, marginBottom: 16 }} />

          {/* Retrieval stats */}
          <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>
            SESSION STATS
          </Text>
          {[
            { label: 'Messages',       value: String(messages.length)  },
            { label: 'Avg Latency',    value: '823ms'                  },
            { label: 'Total Tokens',   value: '1,240'                  },
            { label: 'Citations Used', value: '6'                      },
          ].map((s, i) => (
            <View key={i} style={{
              flexDirection: 'row', justifyContent: 'space-between',
              paddingVertical: 6,
              borderBottomWidth: 1, borderBottomColor: theme.border.default,
            }}>
              <Text style={{ color: theme.text.secondary, fontSize: 11 }}>{s.label}</Text>
              <Text style={{ color: theme.text.primary, fontSize: 11, fontWeight: '600', fontFamily: 'monospace' }}>{s.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
