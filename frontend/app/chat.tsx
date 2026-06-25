import React, { useState, useRef, useEffect } from 'react';
import { Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';

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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: '#8b5cf6', opacity: 0.6,
        }} />
      ))}
      <Text style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>Retrieving context & reasoning…</Text>
    </View>
  );
}

function CitationChip({ source, index }: { source: string; index: number }) {
  const short = source.split('/').pop()?.split(':')[0] ?? source;
  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
      backgroundColor: 'rgba(124,58,237,0.1)',
      borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
      flexDirection: 'row', alignItems: 'center', gap: 5,
    }}>
      <Text style={{ color: '#a78bfa', fontSize: 9, fontWeight: '700' }}>[{index + 1}]</Text>
      <Text style={{ color: '#8b5cf6', fontSize: 10, fontWeight: '500' }}>{short}</Text>
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      sender: 'ASSISTANT',
      text: "Hello! I'm your GEMS RAG Orchestrator. I can answer questions using context retrieved from your embedded documents. What would you like to explore?",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(5);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState('You are an enterprise AI assistant. Answer questions using only the retrieved document context provided. Always cite your sources.');
  const [showCitations, setShowCitations] = useState<string | null>(null);
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
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#05050f' }}>

      {/* ── MAIN CHAT PANE ── */}
      <View style={{ flex: 1, flexDirection: 'column' }}>

        {/* Chat Header */}
        <View style={{
          paddingHorizontal: 24, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(10,10,26,0.8)',
        }}>
          <View>
            <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '700' }}>RAG Chat Playground</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
              <Text style={{ color: '#475569', fontSize: 11 }}>
                Model: <Text style={{ color: '#8b5cf6', fontWeight: '600' }}>{selectedModelObj.label}</Text>
                {'  '}·{'  '}
                TopK: <Text style={{ color: '#60a5fa', fontWeight: '600' }}>{topK} chunks</Text>
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
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>Clear Session</Text>
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
              <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>
                SUGGESTED QUERIES
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleSend(p.text)}
                    style={({ pressed }) => [{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: pressed ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                    }]}
                  >
                    <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                    <View>
                      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>{p.label}</Text>
                      <Text style={{ color: '#475569', fontSize: 10, marginTop: 1, maxWidth: 180 }} numberOfLines={1}>
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
                color: msg.sender === 'USER' ? '#8b5cf6' : '#475569',
                marginBottom: 5,
                alignSelf: msg.sender === 'USER' ? 'flex-end' : 'flex-start',
              }}>
                {msg.sender === 'USER' ? 'YOU' : '✦ GEMS RAG'}
              </Text>

              {/* Bubble */}
              <View style={[{
                borderRadius: 18, padding: 16,
              }, msg.sender === 'USER' ? {
                backgroundColor: 'rgba(124,58,237,0.18)',
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
                borderBottomRightRadius: 4,
              } : {
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                borderBottomLeftRadius: 4,
              }]}>
                {msg.isStreaming && msg.text === '' ? (
                  <TypingIndicator />
                ) : (
                  <Text style={{
                    color: msg.sender === 'USER' ? '#ddd6fe' : '#e2e8f0',
                    fontSize: 13, lineHeight: 21,
                  }}>
                    {msg.text}
                  </Text>
                )}

                {msg.isStreaming && msg.text !== '' && (
                  <View style={{
                    width: 8, height: 16, backgroundColor: '#7c3aed',
                    borderRadius: 1, marginTop: 2, opacity: 0.8,
                  }} />
                )}

                {/* Footer row */}
                {!msg.isStreaming && msg.citations && (
                  <View>
                    <View style={{
                      height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
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
                        <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'monospace' }}>
                          ⏱ {msg.latency}ms
                        </Text>
                      )}
                      {msg.tokens && (
                        <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'monospace' }}>
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
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input Dock ── */}
        <View style={{
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          padding: 16,
          backgroundColor: 'rgba(10,10,26,0.6)',
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', gap: 10,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            paddingHorizontal: 16, paddingVertical: 10,
          }}>
            <TextInput
              placeholder="Ask anything about your documents…"
              placeholderTextColor="#334155"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              multiline
              maxLength={2000}
              style={{
                flex: 1,
                color: '#e2e8f0',
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
                backgroundColor: '#7c3aed',
              }]}
            >
              {isGenerating
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>↑</Text>
              }
            </Pressable>
          </View>
          <Text style={{ color: '#1e293b', fontSize: 10, textAlign: 'center', marginTop: 6 }}>
            GEMS RAG · Context window: 16K · {topK} retrieved chunks · pgvector cosine similarity
          </Text>
        </View>
      </View>

      {/* ── CONFIG PANEL (web, right side) ── */}
      {Platform.OS === 'web' && (
        <View style={{
          width: 300,
          backgroundColor: 'rgba(10,10,26,0.95)',
          borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)',
          padding: 20,
        }}>
          <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 13, marginBottom: 20, letterSpacing: 0.3 }}>
            Orchestrator Config
          </Text>

          {/* Model Select */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
              REASONING MODEL
            </Text>
            {MODELS.map(m => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedModel(m.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, marginBottom: 4,
                  backgroundColor: selectedModel === m.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: selectedModel === m.id ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ color: selectedModel === m.id ? '#c4b5fd' : '#64748b', fontSize: 12, fontWeight: '500' }}>
                  {m.label}
                </Text>
                <View style={{
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                  backgroundColor: selectedModel === m.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                }}>
                  <Text style={{ color: selectedModel === m.id ? '#a78bfa' : '#334155', fontSize: 9, fontWeight: '600' }}>
                    {m.badge}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Temperature */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>TEMPERATURE</Text>
              <Text style={{ color: '#8b5cf6', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' }}>
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
                    backgroundColor: temperature === t ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    borderColor: temperature === t ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: temperature === t ? '#c4b5fd' : '#475569', fontSize: 10, fontWeight: '600' }}>
                    {t.toFixed(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: '#334155', fontSize: 9 }}>Precise</Text>
              <Text style={{ color: '#334155', fontSize: 9 }}>Creative</Text>
            </View>
          </View>

          {/* Top-K */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>TOP-K CHUNKS</Text>
              <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' }}>k={topK}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[2, 3, 5, 8, 10].map(k => (
                <Pressable
                  key={k}
                  onPress={() => setTopK(k)}
                  style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                    backgroundColor: topK === k ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    borderColor: topK === k ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ color: topK === k ? '#93c5fd' : '#475569', fontSize: 10, fontWeight: '600' }}>{k}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* System prompt */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
              SYSTEM DIRECTIVE
            </Text>
            <TextInput
              multiline
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                borderRadius: 10, padding: 12,
                color: '#94a3b8', fontSize: 11, lineHeight: 16,
                minHeight: 90,
              } as any}
            />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />

          {/* Retrieval stats */}
          <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>
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
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <Text style={{ color: '#475569', fontSize: 11 }}>{s.label}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', fontFamily: 'monospace' }}>{s.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
