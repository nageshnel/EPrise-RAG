import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Pressable, ScrollView } from 'react-native';
import { useThemeStore, useThemeColors } from '../stores/themeStore';

interface SettingField {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  secure?: boolean;
  mono?: boolean;
}

interface SettingsSection {
  title: string;
  subtitle: string;
  icon: string;
  colorKey: 'violet' | 'blue' | 'cyan' | 'green';
  fields: SettingField[];
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'Service Endpoints',
    subtitle: 'Backend microservice connection URLs',
    icon: '🔌',
    colorKey: 'violet',
    fields: [
      { key: 'gatewayUrl',     label: 'API Gateway URL',          description: 'Routes all RAG chat commands through the edge gateway',   placeholder: 'http://localhost:8080', mono: true },
      { key: 'embeddingUrl',   label: 'Embedding Service URL',     description: 'BGE-M3 self-hosted TEI server endpoint',                  placeholder: 'http://localhost:8082/embed', mono: true },
      { key: 'retrievalUrl',   label: 'Retrieval Service URL',     description: 'pgvector similarity search interface',                    placeholder: 'http://localhost:8083', mono: true },
      { key: 'ragUrl',         label: 'RAG Orchestrator URL',      description: 'RAG + LLM reasoning orchestration service',               placeholder: 'http://localhost:8084', mono: true },
    ],
  },
  {
    title: 'AI Model Configuration',
    subtitle: 'Embedding and generative model provider settings',
    icon: '🤖',
    colorKey: 'blue',
    fields: [
      { key: 'embeddingModel', label: 'Embedding Model ID',        description: 'Self-hosted model (e.g. BAAI/bge-m3)',                    placeholder: 'BAAI/bge-m3', mono: true },
      { key: 'llmProvider',    label: 'LLM Provider Base URL',     description: 'OpenAI-compatible API endpoint',                         placeholder: 'https://api.openai.com/v1', mono: true },
      { key: 'llmModel',       label: 'Generative Model ID',        description: 'Model identifier for reasoning completions',              placeholder: 'gpt-4o-mini', mono: true },
    ],
  },
  {
    title: 'Security & Authentication',
    subtitle: 'API keys and access credentials',
    icon: '🔐',
    colorKey: 'cyan',
    fields: [
      { key: 'apiKey',         label: 'LLM Provider API Key',      description: 'Bearer credential for OpenAI or compatible provider',    placeholder: 'sk-proj-…', secure: true },
      { key: 'gatewayToken',   label: 'Gateway Auth Token',         description: 'Service-to-service authorization token',                 placeholder: 'eyJhbG…', secure: true },
    ],
  },
  {
    title: 'Observability',
    subtitle: 'Apache SkyWalking OAP monitoring configuration',
    icon: '📡',
    colorKey: 'green',
    fields: [
      { key: 'skywalkingOap',  label: 'SkyWalking OAP gRPC Host', description: 'OAP server for distributed tracing and metrics',          placeholder: 'localhost:11800', mono: true },
      { key: 'skywalkingUi',   label: 'SkyWalking UI URL',         description: 'Web dashboard for trace and topology exploration',        placeholder: 'http://localhost:8080', mono: true },
    ],
  },
];

const DEFAULTS: Record<string, string> = {
  gatewayUrl:     'http://localhost:8080',
  embeddingUrl:   'http://localhost:8082/embed',
  retrievalUrl:   'http://localhost:8083',
  ragUrl:         'http://localhost:8084',
  embeddingModel: 'BAAI/bge-m3',
  llmProvider:    'https://api.openai.com/v1',
  llmModel:       'gpt-4o-mini',
  apiKey:         '',
  gatewayToken:   '',
  skywalkingOap:  'localhost:11800',
  skywalkingUi:   'http://localhost:8080',
};

function InputField({ field, value, onChange }: {
  field: SettingField; value: string; onChange: (v: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: theme.text.secondary, fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 }}>
        {field.label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderRadius: 12, borderWidth: 1,
        borderColor: isFocused ? theme.accent.primary : theme.border.default,
        paddingHorizontal: 14,
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={theme.text.muted}
          secureTextEntry={field.secure && !showSecret}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1, paddingVertical: 12,
            color: theme.text.primary,
            fontSize: 12,
            fontFamily: field.mono ? 'monospace' : 'inherit',
          } as any}
        />
        {field.secure && (
          <Pressable onPress={() => setShowSecret(s => !s)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 14, color: theme.text.muted }}>{showSecret ? '🙈' : '👁'}</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: theme.text.muted, fontSize: 10, marginTop: 4, lineHeight: 14 }}>{field.description}</Text>
    </View>
  );
}

export default function Settings() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();

  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored: Record<string, string> = {};
      Object.keys(DEFAULTS).forEach(k => {
        const v = window.localStorage.getItem(`gems_${k}`);
        if (v) stored[k] = v;
      });
      if (Object.keys(stored).length) setValues(v => ({ ...v, ...stored }));
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.entries(values).forEach(([k, v]) => window.localStorage.setItem(`gems_${k}`, v));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setValues(DEFAULTS);
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.keys(DEFAULTS).forEach(k => window.localStorage.removeItem(`gems_${k}`));
    }
  };

  const sectionColors = mode === 'dark' ? {
    violet: '#7c3aed',
    blue: '#2563eb',
    cyan: '#06b6d4',
    green: '#4ade80',
    violetBg: 'rgba(124,58,237,0.12)',
    blueBg: 'rgba(37,99,235,0.12)',
    cyanBg: 'rgba(6,182,212,0.12)',
    greenBg: 'rgba(74,222,128,0.12)',
    violetIconBg: 'rgba(124,58,237,0.15)',
    blueIconBg: 'rgba(37,99,235,0.15)',
    cyanIconBg: 'rgba(6,182,212,0.15)',
    greenIconBg: 'rgba(74,222,128,0.15)',
  } : {
    violet: '#3b82f6',
    blue: '#2563eb',
    cyan: '#0891b2',
    green: '#10b981',
    violetBg: 'rgba(59,130,246,0.1)',
    blueBg: 'rgba(37,99,235,0.1)',
    cyanBg: 'rgba(8,145,178,0.1)',
    greenBg: 'rgba(16,185,129,0.1)',
    violetIconBg: 'rgba(59,130,246,0.12)',
    blueIconBg: 'rgba(37,99,235,0.12)',
    cyanIconBg: 'rgba(8,145,178,0.12)',
    greenIconBg: 'rgba(16,185,129,0.12)',
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg.primary }}>

      {/* ── LEFT: Section Nav ── */}
      <View style={{
        width: 220,
        backgroundColor: theme.nav.bg,
        borderRightWidth: 1, borderRightColor: theme.border.default,
        paddingTop: 28, paddingHorizontal: 12,
      }}>
        <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12, paddingLeft: 8 }}>
          SETTINGS
        </Text>
        {SECTIONS.map((s, i) => {
          const activeColor = sectionColors[s.colorKey];
          const activeBg = sectionColors[`${s.colorKey}Bg` as keyof typeof sectionColors];
          return (
            <Pressable
              key={i}
              onPress={() => setActiveSection(i)}
              style={[{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, marginBottom: 2,
              }, activeSection === i ? {
                backgroundColor: activeBg,
                borderLeftWidth: 2, borderLeftColor: activeColor,
                paddingLeft: 10,
              } : {}]}
            >
              <Text style={{ fontSize: 15 }}>{s.icon}</Text>
              <Text style={{
                fontSize: 12, fontWeight: '500',
                color: activeSection === i ? theme.text.primary : theme.text.secondary,
              }}>{s.title}</Text>
            </Pressable>
          );
        })}

        {/* Connection status */}
        <View style={{
          margin: 8, marginTop: 24,
          backgroundColor: mode === 'dark' ? 'rgba(74,222,128,0.06)' : 'rgba(16,185,129,0.06)',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(74,222,128,0.12)' : 'rgba(16,185,129,0.12)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: mode === 'dark' ? '#4ade80' : '#10b981' }} />
            <Text style={{ color: mode === 'dark' ? '#4ade80' : '#10b981', fontSize: 11, fontWeight: '700' }}>Connected</Text>
          </View>
          <Text style={{ color: theme.text.muted, fontSize: 10 }}>Gateway: localhost:8080</Text>
          <Text style={{ color: theme.text.muted, fontSize: 10, marginTop: 2 }}>OAP: localhost:11800</Text>
        </View>
      </View>

      {/* ── RIGHT: Active Section ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 32, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: theme.text.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
            CONFIGURATION  /  {SECTIONS[activeSection].title.toUpperCase()}
          </Text>
          <Text style={{ color: theme.text.primary, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 }}>
            {SECTIONS[activeSection].title}
          </Text>
          <Text style={{ color: theme.text.secondary, fontSize: 12, marginTop: 4 }}>
            {SECTIONS[activeSection].subtitle}
          </Text>
        </View>

        {/* Section form */}
        <View style={{
          backgroundColor: theme.bg.card,
          borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: theme.border.default,
          marginBottom: 20,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
            paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border.default,
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: sectionColors[`${SECTIONS[activeSection].colorKey}IconBg` as keyof typeof sectionColors],
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 17 }}>{SECTIONS[activeSection].icon}</Text>
            </View>
            <View>
              <Text style={{ color: theme.text.primary, fontSize: 13, fontWeight: '700' }}>{SECTIONS[activeSection].title}</Text>
              <Text style={{ color: theme.text.secondary, fontSize: 11 }}>{SECTIONS[activeSection].fields.length} fields</Text>
            </View>
          </View>

          {SECTIONS[activeSection].fields.map(field => (
            <InputField
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
            />
          ))}
        </View>

        {/* All sections quick summary */}
        <View style={{
          backgroundColor: theme.bg.card,
          borderRadius: 16, padding: 20,
          borderWidth: 1, borderColor: theme.border.default,
          marginBottom: 24,
        }}>
          <Text style={{ color: theme.text.secondary, fontSize: 11, fontWeight: '600', marginBottom: 12 }}>
            Configuration Overview
          </Text>
          {SECTIONS.map((s, i) => (
            <View key={i} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: i < SECTIONS.length - 1 ? 1 : 0,
              borderBottomColor: theme.border.default,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13 }}>{s.icon}</Text>
                <Text style={{ color: theme.text.secondary, fontSize: 12 }}>{s.title}</Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                backgroundColor: mode === 'dark' ? 'rgba(74,222,128,0.08)' : 'rgba(16,185,129,0.08)',
              }}>
                <Text style={{ color: mode === 'dark' ? '#4ade80' : '#10b981', fontSize: 10, fontWeight: '600' }}>
                  {s.fields.length} fields
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Reset */}
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => ({
              flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
              backgroundColor: pressed 
                ? (mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') 
                : theme.bg.card,
              borderWidth: 1, borderColor: theme.border.default,
            })}
          >
            <Text style={{ color: theme.text.secondary, fontWeight: '600', fontSize: 13 }}>Reset to Defaults</Text>
          </Pressable>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              backgroundColor: saved ? (mode === 'dark' ? '#065f46' : '#047857') : theme.accent.primary,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            {saved ? (
              <>
                <Text style={{ color: mode === 'dark' ? '#4ade80' : '#d1fae5', fontSize: 15 }}>✓</Text>
                <Text style={{ color: mode === 'dark' ? '#4ade80' : '#d1fae5', fontWeight: '700', fontSize: 13 }}>Configuration Saved</Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save Configuration</Text>
            )}
          </Pressable>
        </View>

        {/* Environment hint */}
        <View style={{
          marginTop: 20, padding: 14, borderRadius: 12,
          backgroundColor: mode === 'dark' ? 'rgba(37,99,235,0.06)' : 'rgba(59,130,246,0.06)',
          borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(37,99,235,0.12)' : 'rgba(59,130,246,0.12)',
          flexDirection: 'row', gap: 10,
        }}>
          <Text style={{ fontSize: 14 }}>💡</Text>
          <Text style={{ color: theme.text.secondary, fontSize: 11, lineHeight: 17, flex: 1 }}>
            Settings are persisted to browser localStorage. For production deployments, configure these values via environment variables or Kubernetes ConfigMaps referenced in the service YAML manifests.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
