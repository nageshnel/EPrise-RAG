import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Pressable, ScrollView } from 'react-native';

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
  color: string;
  fields: SettingField[];
}

const SECTIONS: SettingsSection[] = [
  {
    title: 'Service Endpoints',
    subtitle: 'Backend microservice connection URLs',
    icon: '🔌',
    color: '#7c3aed',
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
    color: '#2563eb',
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
    color: '#06b6d4',
    fields: [
      { key: 'apiKey',         label: 'LLM Provider API Key',      description: 'Bearer credential for OpenAI or compatible provider',    placeholder: 'sk-proj-…', secure: true },
      { key: 'gatewayToken',   label: 'Gateway Auth Token',         description: 'Service-to-service authorization token',                 placeholder: 'eyJhbG…', secure: true },
    ],
  },
  {
    title: 'Observability',
    subtitle: 'Apache SkyWalking OAP monitoring configuration',
    icon: '📡',
    color: '#4ade80',
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

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 }}>
        {field.label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12, borderWidth: 1,
        borderColor: isFocused ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.08)',
        paddingHorizontal: 14,
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor="#334155"
          secureTextEntry={field.secure && !showSecret}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1, paddingVertical: 12,
            color: '#e2e8f0',
            fontSize: 12,
            fontFamily: field.mono ? 'monospace' : 'inherit',
          } as any}
        />
        {field.secure && (
          <Pressable onPress={() => setShowSecret(s => !s)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 14, color: '#475569' }}>{showSecret ? '🙈' : '👁'}</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: '#334155', fontSize: 10, marginTop: 4, lineHeight: 14 }}>{field.description}</Text>
    </View>
  );
}

export default function Settings() {
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

  const colorMap: Record<string, string> = {
    '#7c3aed': 'rgba(124,58,237,',
    '#2563eb': 'rgba(37,99,235,',
    '#06b6d4': 'rgba(6,182,212,',
    '#4ade80': 'rgba(74,222,128,',
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#05050f' }}>

      {/* ── LEFT: Section Nav ── */}
      <View style={{
        width: 220,
        backgroundColor: 'rgba(10,10,26,0.6)',
        borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)',
        paddingTop: 28, paddingHorizontal: 12,
      }}>
        <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12, paddingLeft: 8 }}>
          SETTINGS
        </Text>
        {SECTIONS.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => setActiveSection(i)}
            style={[{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, marginBottom: 2,
            }, activeSection === i ? {
              backgroundColor: (colorMap[s.color] ?? 'rgba(124,58,237,') + '0.12)',
              borderLeftWidth: 2, borderLeftColor: s.color,
              paddingLeft: 10,
            } : {}]}
          >
            <Text style={{ fontSize: 15 }}>{s.icon}</Text>
            <Text style={{
              fontSize: 12, fontWeight: '500',
              color: activeSection === i ? '#e2e8f0' : '#475569',
            }}>{s.title}</Text>
          </Pressable>
        ))}

        {/* Connection status */}
        <View style={{
          margin: 8, marginTop: 24,
          backgroundColor: 'rgba(74,222,128,0.06)',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: 'rgba(74,222,128,0.12)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' }} />
            <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>Connected</Text>
          </View>
          <Text style={{ color: '#334155', fontSize: 10 }}>Gateway: localhost:8080</Text>
          <Text style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>OAP: localhost:11800</Text>
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
          <Text style={{ color: '#334155', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
            CONFIGURATION  /  {SECTIONS[activeSection].title.toUpperCase()}
          </Text>
          <Text style={{ color: '#f1f5f9', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 }}>
            {SECTIONS[activeSection].title}
          </Text>
          <Text style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
            {SECTIONS[activeSection].subtitle}
          </Text>
        </View>

        {/* Section form */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
          marginBottom: 20,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
            paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: (colorMap[SECTIONS[activeSection].color] ?? 'rgba(124,58,237,') + '0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 17 }}>{SECTIONS[activeSection].icon}</Text>
            </View>
            <View>
              <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '700' }}>{SECTIONS[activeSection].title}</Text>
              <Text style={{ color: '#475569', fontSize: 11 }}>{SECTIONS[activeSection].fields.length} fields</Text>
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
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: 16, padding: 20,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
          marginBottom: 24,
        }}>
          <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600', marginBottom: 12 }}>
            Configuration Overview
          </Text>
          {SECTIONS.map((s, i) => (
            <View key={i} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: i < SECTIONS.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.04)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13 }}>{s.icon}</Text>
                <Text style={{ color: '#64748b', fontSize: 12 }}>{s.title}</Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                backgroundColor: 'rgba(74,222,128,0.08)',
              }}>
                <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: '600' }}>
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
              backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            })}
          >
            <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>Reset to Defaults</Text>
          </Pressable>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              backgroundColor: saved ? '#065f46' : '#7c3aed',
              opacity: pressed ? 0.88 : 1,
            })}
          >
            {saved ? (
              <>
                <Text style={{ color: '#4ade80', fontSize: 15 }}>✓</Text>
                <Text style={{ color: '#4ade80', fontWeight: '700', fontSize: 13 }}>Configuration Saved</Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save Configuration</Text>
            )}
          </Pressable>
        </View>

        {/* Environment hint */}
        <View style={{
          marginTop: 20, padding: 14, borderRadius: 12,
          backgroundColor: 'rgba(37,99,235,0.06)',
          borderWidth: 1, borderColor: 'rgba(37,99,235,0.12)',
          flexDirection: 'row', gap: 10,
        }}>
          <Text style={{ fontSize: 14 }}>💡</Text>
          <Text style={{ color: '#475569', fontSize: 11, lineHeight: 17, flex: 1 }}>
            Settings are persisted to browser localStorage. For production deployments, configure these values via environment variables or Kubernetes ConfigMaps referenced in the service YAML manifests.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
