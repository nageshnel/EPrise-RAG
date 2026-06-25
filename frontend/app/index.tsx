import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';

// ── Animated counter hook (web only)
function useCounter(target: number, duration = 1500, suffix = '') {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else { setValue(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// ── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  color: 'violet' | 'blue' | 'cyan' | 'indigo';
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ label, value, sub, color, icon, trend, trendUp }: MetricCardProps) {
  const glowMap = {
    violet: 'rgba(124,58,237,0.12)',
    blue:   'rgba(37,99,235,0.12)',
    cyan:   'rgba(6,182,212,0.12)',
    indigo: 'rgba(99,102,241,0.12)',
  };
  const borderMap = {
    violet: 'rgba(124,58,237,0.2)',
    blue:   'rgba(37,99,235,0.2)',
    cyan:   'rgba(6,182,212,0.2)',
    indigo: 'rgba(99,102,241,0.2)',
  };
  const textMap = {
    violet: '#a78bfa',
    blue:   '#60a5fa',
    cyan:   '#22d3ee',
    indigo: '#818cf8',
  };

  return (
    <View style={{
      flex: 1, minWidth: 140,
      backgroundColor: glowMap[color],
      borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: borderMap[color],
      marginHorizontal: 6, marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        {trend && (
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
            backgroundColor: trendUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: trendUp ? '#4ade80' : '#f87171' }}>
              {trendUp ? '↑' : '↓'} {trend}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: textMap[color], letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{sub}</Text>
    </View>
  );
}

// ── Service Card ─────────────────────────────────────────────────────────────
interface ServiceCardProps {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  icon: string;
  iconBg: string;
  stats: { label: string; value: string }[];
  cta: string;
  onPress: () => void;
}

function ServiceCard({ title, description, badge, badgeColor, accentColor, icon, iconBg, stats, cta, onPress }: ServiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        flex: 1, minWidth: 260,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        marginHorizontal: 6, marginBottom: 12,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      }]}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
          backgroundColor: badgeColor + '15', borderWidth: 1, borderColor: badgeColor + '30',
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor, letterSpacing: 0.5 }}>{badge}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginBottom: 8, letterSpacing: -0.2 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 16 }}>
        {description}
      </Text>

      {/* Stats row */}
      <View style={{
        flexDirection: 'row', gap: 12, marginBottom: 16,
        paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
      }}>
        {stats.map((s, i) => (
          <View key={i} style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: accentColor }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: '#475569' }}>Tap to explore</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor }}>{cta} →</Text>
      </View>
    </Pressable>
  );
}

// ── Pipeline Status ──────────────────────────────────────────────────────────
interface PipelineStep {
  name: string;
  status: 'done' | 'active' | 'idle';
  time: string;
}

function PipelineRow({ step }: { step: PipelineStep }) {
  const colors = { done: '#4ade80', active: '#a78bfa', idle: '#334155' };
  const bg = { done: 'rgba(74,222,128,0.1)', active: 'rgba(167,139,250,0.1)', idle: 'rgba(51,65,85,0.3)' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 8, backgroundColor: bg[step.status],
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
        borderWidth: 1, borderColor: colors[step.status] + '30',
      }}>
        <Text style={{ fontSize: 11, color: colors[step.status], fontWeight: '700' }}>
          {step.status === 'done' ? '✓' : step.status === 'active' ? '◎' : '○'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: step.status === 'idle' ? '#475569' : '#e2e8f0' }}>
          {step.name}
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{step.time}</Text>
    </View>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();

  const pipelineSteps: PipelineStep[] = [
    { name: 'Document Ingestion (Kafka ETL)',   status: 'done',   time: '0.3s avg' },
    { name: 'Text Chunking & Preprocessing',    status: 'done',   time: '0.8s avg' },
    { name: 'BGE-M3 Embedding Computation',     status: 'active', time: '1.2s avg' },
    { name: 'pgvector Index Upsert',            status: 'done',   time: '0.15s avg' },
    { name: 'SkyWalking Trace Flush',           status: 'idle',   time: '—' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#05050f' }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Aurora Header ── */}
      <View style={{
        paddingHorizontal: 32, paddingTop: 36, paddingBottom: 32,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(124,58,237,0.03)',
      }}>
        {/* Breadcrumb */}
        <Text style={{ color: '#475569', fontSize: 11, letterSpacing: 2, fontWeight: '600', marginBottom: 12 }}>
          PLATFORM  /  OVERVIEW
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, lineHeight: 36 }}>
              AIRAG{' '}
              <Text style={{
                fontSize: 30, fontWeight: '800', letterSpacing: -0.5,
                // Gradient text via color split since RN doesn't support gradient text inline
                color: '#a78bfa',
              }}>Architecture</Text>
            </Text>
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 6, maxWidth: 480 }}>
              Enterprise cognitive retrieval and AI reasoning orchestrator. Real-time SkyWalking telemetry.
            </Text>
          </View>

          {/* Live status badge */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24,
            backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
          }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80',
            }} />
            <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>All Systems Operational</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>

        {/* ── Telemetry Metrics Row ── */}
        <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 14, paddingLeft: 6 }}>
          LIVE TELEMETRY  ·  SkyWalking OAP
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 24 }}>
          <MetricCard label="Documents Processed"  value="1,482"   sub="All-time ingested"    color="violet" icon="📄" trend="12%" trendUp={true} />
          <MetricCard label="Chunks Generated"      value="42.8k"  sub="Vector store size"    color="blue"   icon="🧩" trend="8%"  trendUp={true} />
          <MetricCard label="Embedding Latency"     value="1.24s"  sub="BGE-M3 · p95"         color="cyan"   icon="⚡" trend="5%"  trendUp={false} />
          <MetricCard label="RAG Latency (p95)"     value="980ms"  sub="End-to-end query"      color="indigo" icon="🔍" trend="3%"  trendUp={false} />
        </View>

        {/* Second metrics row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 32 }}>
          <MetricCard label="LLM Tokens / Day"     value="2.4M"   sub="Prompt + completion"   color="violet" icon="🪙" trend="18%" trendUp={true} />
          <MetricCard label="Est. LLM Cost"         value="$1.82"  sub="Today · GPT-4o-mini"   color="blue"   icon="💰" trend="4%"  trendUp={true} />
          <MetricCard label="Tool Calls"            value="347"    sub="Function invocations"  color="cyan"   icon="🔧" trend="21%" trendUp={true} />
          <MetricCard label="RAG Queries / hr"      value="290"    sub="Active orchestration"  color="indigo" icon="📊" trend="9%"  trendUp={true} />
        </View>

        {/* ── Service Cards ── */}
        <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 14, paddingLeft: 6 }}>
          MICROSERVICES
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 32 }}>
          <ServiceCard
            title="Embedding & ETL Pipeline"
            description="Process enterprise documents via Kafka ETL, chunk text context, and compute dense vector embeddings using self-hosted BGE-M3 model."
            badge="ACTIVE"
            badgeColor="#4ade80"
            accentColor="#a78bfa"
            icon="🧬"
            iconBg="rgba(124,58,237,0.15)"
            stats={[
              { label: 'Throughput', value: '24/min' },
              { label: 'Queue Depth', value: '3' },
              { label: 'Model', value: 'BGE-M3' },
            ]}
            cta="Manage Documents"
            onPress={() => router.push('/documents')}
          />

          <ServiceCard
            title="RAG Orchestration & Chat"
            description="Run cosine similarity queries against pgvector, augment prompt contexts with retrieved chunks, and stream generative AI completions."
            badge="ACTIVE"
            badgeColor="#4ade80"
            accentColor="#60a5fa"
            icon="🤖"
            iconBg="rgba(37,99,235,0.15)"
            stats={[
              { label: 'Avg Chunks', value: '4.2' },
              { label: 'LLM', value: 'GPT-4o' },
              { label: 'Hit Rate', value: '94%' },
            ]}
            cta="Open Playground"
            onPress={() => router.push('/chat')}
          />
        </View>

        {/* ── ETL Pipeline Progress ── */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700' }}>ETL Pipeline Status</Text>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
              backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
            }}>
              <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '700' }}>3/5 STAGES</Text>
            </View>
          </View>
          <Text style={{ color: '#475569', fontSize: 11, marginBottom: 16 }}>Real-time ingestion pipeline stage visibility</Text>

          {/* Progress bar */}
          <View style={{
            height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 20,
          }}>
            <View style={{
              height: 4, width: '60%', borderRadius: 2,
              backgroundColor: '#7c3aed',
            }} />
          </View>

          <View>
            {pipelineSteps.map((step, i) => (
              <View key={i}>
                <PipelineRow step={step} />
                {i < pipelineSteps.length - 1 && (
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 40 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Architecture Services Grid ── */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        }}>
          <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>Microservice Health</Text>
          <Text style={{ color: '#475569', fontSize: 11, marginBottom: 20 }}>Apache SkyWalking OAP — service mesh topology</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { name: 'API Gateway',        port: ':8080', status: 'UP', color: '#4ade80' },
              { name: 'ETL Service',         port: ':8081', status: 'UP', color: '#4ade80' },
              { name: 'Embedding Service',   port: ':8082', status: 'UP', color: '#4ade80' },
              { name: 'Retrieval Service',   port: ':8083', status: 'UP', color: '#4ade80' },
              { name: 'RAG Orchestrator',   port: ':8084', status: 'UP', color: '#4ade80' },
              { name: 'Media Service',       port: ':8085', status: 'DEGRADED', color: '#fbbf24' },
              { name: 'PostgreSQL/pgvector', port: ':5432', status: 'UP', color: '#4ade80' },
              { name: 'Kafka Broker',        port: ':9092', status: 'UP', color: '#4ade80' },
            ].map((svc, i) => (
              <View key={i} style={{
                paddingHorizontal: 14, paddingVertical: 10,
                borderRadius: 12, minWidth: 160,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: svc.color }} />
                  <Text style={{ color: svc.color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{svc.status}</Text>
                </View>
                <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>{svc.name}</Text>
                <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>{svc.port}</Text>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
