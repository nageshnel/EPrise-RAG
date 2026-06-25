import React, { useState } from 'react';
import { Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

type DocStatus = 'PENDING' | 'PROCESSING' | 'EMBEDDED' | 'FAILED';

interface KBDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: DocStatus;
  chunks: number;
  embeddingTime?: string;
  uploadedAt: string;
}

interface VectorResult {
  chunkId: string;
  content: string;
  score: number;
  source: string;
  page?: number;
}

const statusConfig: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:    { label: 'Pending',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: '○'  },
  PROCESSING: { label: 'Processing', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  icon: '◎'  },
  EMBEDDED:   { label: 'Embedded',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  icon: '✓'  },
  FAILED:     { label: 'Failed',     color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: '✕'  },
};

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', doc: '📝', md: '⬡', txt: '📋', csv: '📊', default: '📁',
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? 'default';
  return FILE_ICONS[ext] ?? FILE_ICONS.default;
}

function getFileType(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score > 0.9 ? '#4ade80' : score > 0.75 ? '#a78bfa' : '#60a5fa';
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: '#475569', fontSize: 10 }}>Similarity Score</Text>
        <Text style={{ color, fontSize: 10, fontWeight: '700', fontFamily: 'monospace' }}>{(score * 100).toFixed(1)}%</Text>
      </View>
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <View style={{ height: 3, width: `${pct}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<KBDocument[]>([
    { id: '1', name: 'corporate_security_policy.pdf',   type: 'PDF',  size: '2.4 MB',  status: 'EMBEDDED',    chunks: 14, embeddingTime: '1.8s', uploadedAt: '2h ago' },
    { id: '2', name: 'q3_earnings_report.docx',         type: 'DOCX', size: '1.1 MB',  status: 'PROCESSING',  chunks: 8,  embeddingTime: '—',    uploadedAt: '35m ago' },
    { id: '3', name: 'whisper_api_integration.md',      type: 'MD',   size: '340 KB',  status: 'PENDING',     chunks: 0,  embeddingTime: '—',    uploadedAt: '12m ago' },
    { id: '4', name: 'kubernetes_cluster_config.yaml',  type: 'YAML', size: '88 KB',   status: 'EMBEDDED',    chunks: 5,  embeddingTime: '0.6s', uploadedAt: '1d ago' },
    { id: '5', name: 'bge_m3_benchmark_results.csv',    type: 'CSV',  size: '1.9 MB',  status: 'FAILED',      chunks: 0,  embeddingTime: '—',    uploadedAt: '3d ago' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VectorResult[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents');
  const [isUploading, setIsUploading] = useState(false);

  const handlePickDocument = async () => {
    setIsUploading(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.length > 0) {
        const file = res.assets[0];
        const newDoc: KBDocument = {
          id: String(Date.now()),
          name: file.name,
          type: getFileType(file.name),
          size: `${((file.size ?? 102400) / (1024 * 1024)).toFixed(2)} MB`,
          status: 'PENDING',
          chunks: 0,
          uploadedAt: 'Just now',
        };
        setDocuments(d => [newDoc, ...d]);

        setTimeout(() => {
          setDocuments(d => d.map(doc => doc.id === newDoc.id ? { ...doc, status: 'PROCESSING', chunks: 3 } : doc));
          setTimeout(() => {
            setDocuments(d => d.map(doc => doc.id === newDoc.id ? { ...doc, status: 'EMBEDDED', chunks: 7, embeddingTime: '2.1s' } : doc));
          }, 4000);
        }, 2000);
      }
    } catch (e) {
      console.log('pick error', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    setTimeout(() => {
      setSearchResults([
        {
          chunkId: 'chk_9f83a',
          content: `Enterprise security policies mandate multi-factor authentication (MFA) across all staging and production cluster access control points. TOTP-based authenticators are required for admin roles, with hardware keys recommended.`,
          score: 0.942,
          source: 'corporate_security_policy.pdf',
          page: 12,
        },
        {
          chunkId: 'chk_1c28b',
          content: `All RAG orchestrator integrations and model service APIs must communicate over TLS 1.3 encryption layers. External endpoints enforce a minimum of TLS 1.2 with cipher suite whitelisting.`,
          score: 0.881,
          source: 'corporate_security_policy.pdf',
          page: 28,
        },
        {
          chunkId: 'chk_3e94f',
          content: `Kubernetes secrets used by embedding and RAG services must be stored in Vault-backed external secret stores. Plain kubernetes secrets are prohibited in production namespaces.`,
          score: 0.754,
          source: 'kubernetes_cluster_config.yaml',
          page: undefined,
        },
      ]);
      setIsSearching(false);
    }, 1400);
  };

  const embeddedCount = documents.filter(d => d.status === 'EMBEDDED').length;
  const totalChunks   = documents.reduce((a, d) => a + d.chunks, 0);
  const processingCount = documents.filter(d => d.status === 'PROCESSING').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#05050f' }}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: 32, paddingTop: 32, paddingBottom: 24,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,10,26,0.5)',
      }}>
        <Text style={{ color: '#475569', fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
          KNOWLEDGE BASE  /  DOCUMENT CENTER
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <View>
            <Text style={{ color: '#f1f5f9', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
              Document <Text style={{ color: '#8b5cf6' }}>&</Text> Embedding Center
            </Text>
            <Text style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
              Upload documents · Monitor ETL pipeline · Test vector search
            </Text>
          </View>

          {/* Quick stats */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { label: 'Embedded', value: embeddedCount, color: '#4ade80' },
              { label: 'Chunks',   value: totalChunks,   color: '#a78bfa' },
              { label: 'Active',   value: processingCount, color: '#fbbf24' },
            ].map((s, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Upload Zone ── */}
        <Pressable
          onPress={handlePickDocument}
          disabled={isUploading}
          style={({ pressed, hovered }: any) => [{
            borderRadius: 20, padding: 32, marginBottom: 24,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderStyle: 'dashed',
            borderColor: pressed || hovered ? 'rgba(124,58,237,0.6)' : 'rgba(124,58,237,0.25)',
            backgroundColor: pressed || hovered ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.02)',
          }]}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={{ color: '#8b5cf6', fontWeight: '600', fontSize: 13, marginTop: 12 }}>Uploading & queuing…</Text>
            </>
          ) : (
            <>
              <View style={{
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: 'rgba(124,58,237,0.12)',
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Text style={{ fontSize: 28 }}>⬆</Text>
              </View>
              <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 15, marginBottom: 6 }}>
                Drop files or click to upload
              </Text>
              <Text style={{ color: '#475569', fontSize: 12, textAlign: 'center', maxWidth: 380 }}>
                Supports PDF · DOCX · MD · TXT · YAML · CSV{'\n'}
                Documents are chunked and embedded via BGE-M3 through the Kafka ETL pipeline
              </Text>
              <View style={{
                marginTop: 16, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 24,
                backgroundColor: 'rgba(124,58,237,0.15)',
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)',
              }}>
                <Text style={{ color: '#c4b5fd', fontWeight: '700', fontSize: 12 }}>Select Files</Text>
              </View>
            </>
          )}
        </Pressable>

        {/* ── Tabs ── */}
        <View style={{
          flexDirection: 'row', marginBottom: 20,
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 12, padding: 4,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {([
            { key: 'documents', label: '📁  Documents', count: documents.length },
            { key: 'search',    label: '🔍  Vector Search', count: searchResults.length },
          ] as const).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                paddingVertical: 9, borderRadius: 8, gap: 6,
                backgroundColor: activeTab === tab.key ? 'rgba(124,58,237,0.15)' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: activeTab === tab.key ? '#c4b5fd' : '#475569',
              }}>{tab.label}</Text>
              {tab.count > 0 && (
                <View style={{
                  width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: activeTab === tab.key ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                }}>
                  <Text style={{ fontSize: 9, color: activeTab === tab.key ? '#c4b5fd' : '#475569', fontWeight: '700' }}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Document List ── */}
        {activeTab === 'documents' && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 20, overflow: 'hidden',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
          }}>
            {/* Table header */}
            <View style={{
              flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}>
              {['Document', 'Type', 'Size', 'Chunks', 'Status', 'Uploaded'].map((h, i) => (
                <Text key={i} style={{
                  flex: i === 0 ? 3 : 1,
                  color: '#334155', fontSize: 10, fontWeight: '700', letterSpacing: 1,
                }}>{h}</Text>
              ))}
            </View>

            {documents.map((doc, idx) => {
              const cfg = statusConfig[doc.status];
              return (
                <View key={doc.id} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 20, paddingVertical: 16,
                  borderBottomWidth: idx < documents.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.04)',
                }}>
                  {/* Name */}
                  <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>{getFileIcon(doc.name)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      {doc.embeddingTime && doc.embeddingTime !== '—' && (
                        <Text style={{ color: '#334155', fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
                          ⚡ {doc.embeddingTime} embed
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Type */}
                  <View style={{ flex: 1 }}>
                    <View style={{
                      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}>
                      <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '700', fontFamily: 'monospace' }}>
                        {doc.type}
                      </Text>
                    </View>
                  </View>
                  {/* Size */}
                  <Text style={{ flex: 1, color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{doc.size}</Text>
                  {/* Chunks */}
                  <Text style={{ flex: 1, color: doc.chunks > 0 ? '#a78bfa' : '#334155', fontSize: 12, fontWeight: '600', fontFamily: 'monospace' }}>
                    {doc.chunks > 0 ? doc.chunks : '—'}
                  </Text>
                  {/* Status */}
                  <View style={{ flex: 1 }}>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start',
                      backgroundColor: cfg.bg,
                    }}>
                      <Text style={{ color: cfg.color, fontSize: 9 }}>{cfg.icon}</Text>
                      <Text style={{ color: cfg.color, fontSize: 9, fontWeight: '700' }}>{cfg.label}</Text>
                    </View>
                    {doc.status === 'PROCESSING' && (
                      <ActivityIndicator size="small" color="#fbbf24" style={{ marginTop: 4 }} />
                    )}
                  </View>
                  {/* Uploaded */}
                  <Text style={{ flex: 1, color: '#334155', fontSize: 10 }}>{doc.uploadedAt}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Vector Search ── */}
        {activeTab === 'search' && (
          <View>
            {/* Search input */}
            <View style={{
              flexDirection: 'row', gap: 10, marginBottom: 20,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 16, padding: 4,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
            }}>
              <TextInput
                placeholder="Enter query to test similarity search against pgvector…"
                placeholderTextColor="#334155"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                style={{
                  flex: 1, paddingHorizontal: 16, paddingVertical: 10,
                  color: '#e2e8f0', fontSize: 13,
                } as any}
              />
              <Pressable
                onPress={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                style={({ pressed }) => ({
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#7c3aed',
                  opacity: (isSearching || !searchQuery.trim()) ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                {isSearching
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Search</Text>}
              </Pressable>
            </View>

            {/* Search hint */}
            {searchResults.length === 0 && !isSearching && (
              <View style={{
                padding: 28, alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
              }}>
                <Text style={{ fontSize: 28, marginBottom: 10 }}>🔍</Text>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Vector Similarity Search</Text>
                <Text style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
                  Enter a natural language query to test cosine similarity retrieval against your embedded pgvector index.
                </Text>
              </View>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <View>
                <Text style={{ color: '#334155', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>
                  {searchResults.length} RESULTS  ·  BGE-M3  ·  COSINE SIMILARITY
                </Text>
                {searchResults.map((r, i) => (
                  <View key={i} style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 16, padding: 18, marginBottom: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}>
                    {/* Result header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 6,
                          backgroundColor: 'rgba(124,58,237,0.15)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '700' }}>#{i + 1}</Text>
                        </View>
                        <Text style={{ color: '#8b5cf6', fontSize: 11, fontWeight: '600' }}>{r.source}</Text>
                        {r.page && (
                          <Text style={{ color: '#475569', fontSize: 10, fontFamily: 'monospace' }}>p.{r.page}</Text>
                        )}
                      </View>
                      <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace' }}>{r.chunkId}</Text>
                    </View>

                    <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 19, marginBottom: 12 }}>{r.content}</Text>
                    <ScoreBar score={r.score} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
