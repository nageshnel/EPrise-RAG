import React, { useState } from 'react';
import { Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore, useThemeColors } from '../stores/themeStore';
import { authFetch } from '../utils/api';

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
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();
  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));

  const color = score > 0.9
    ? (mode === 'dark' ? '#4ade80' : '#10b981')
    : score > 0.75
      ? theme.accent.primary
      : (mode === 'dark' ? '#60a5fa' : '#2563eb');

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: theme.text.muted, fontSize: 10 }}>Similarity Score</Text>
        <Text style={{ color, fontSize: 10, fontWeight: '700', fontFamily: 'monospace' }}>{(score * 100).toFixed(1)}%</Text>
      </View>
      <View style={{ height: 3, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <View style={{ height: 3, width: `${pct}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export default function DocumentCenter() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useThemeColors();

  const [documents, setDocuments] = useState<KBDocument[]>([
    { id: '1', name: 'corporate_security_policy.pdf',   type: 'PDF',  size: '2.4 MB',  status: 'EMBEDDED',    chunks: 14, embeddingTime: '1.8s', uploadedAt: '2h ago' },
    { id: '2', name: 'q3_earnings_report.docx',         type: 'DOCX', size: '1.1 MB',  status: 'EMBEDDED',    chunks: 8,  embeddingTime: '0.9s', uploadedAt: '35m ago' },
    { id: '3', name: 'whisper_api_integration.md',      type: 'MD',   size: '340 KB',  status: 'EMBEDDED',    chunks: 4,  embeddingTime: '0.4s', uploadedAt: '12m ago' },
    { id: '4', name: 'kubernetes_cluster_config.yaml',  type: 'YAML', size: '88 KB',   status: 'EMBEDDED',    chunks: 5,  embeddingTime: '0.6s', uploadedAt: '1d ago' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VectorResult[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents');
  const [isUploading, setIsUploading] = useState(false);

  const statusConfig: Record<DocStatus, { label: string; color: string; bg: string; icon: string }> = {
    PENDING:    { label: 'Pending',    color: theme.text.secondary, bg: mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.1)', icon: '○'  },
    PROCESSING: { label: 'Processing', color: mode === 'dark' ? '#fbbf24' : '#d97706', bg: mode === 'dark' ? 'rgba(251,191,36,0.1)' : 'rgba(217,119,6,0.1)',  icon: '◎'  },
    EMBEDDED:   { label: 'Embedded',   color: mode === 'dark' ? '#4ade80' : '#10b981', bg: mode === 'dark' ? 'rgba(74,222,128,0.1)' : 'rgba(16,185,129,0.1)',  icon: '✓'  },
    FAILED:     { label: 'Failed',     color: theme.accent.error, bg: mode === 'dark' ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.08)', icon: '✕'  },
  };

  const handlePickDocument = async () => {
    setIsUploading(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.length > 0) {
        const file = res.assets[0];

        const formData = new FormData();
        let fileAsset: any;
        if (Platform.OS === 'web') {
          if (file.file) {
            fileAsset = file.file;
          } else {
            const blobRes = await fetch(file.uri);
            fileAsset = await blobRes.blob();
          }
        } else {
          fileAsset = {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as any;
        }
        formData.append('file', fileAsset, file.name);

        const uploadRes = await authFetch('/documents', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Server returned HTTP ${uploadRes.status}`);
        }

        const data = await uploadRes.json(); // returns { documentId, filename, chunksPublished }

        if (data.chunksPublished === 0) {
          throw new Error('No text content could be extracted from this file. If this is an image or scanned document, please ensure Tesseract OCR is installed and configured in the backend.');
        }

        const newDoc: KBDocument = {
          id: data.documentId || String(Date.now()),
          name: data.filename || file.name,
          type: getFileType(data.filename || file.name),
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '—',
          status: 'EMBEDDED',
          chunks: data.chunksPublished || 0,
          embeddingTime: '0.8s',
          uploadedAt: 'Just now',
        };
        setDocuments(d => [newDoc, ...d]);
      }
    } catch (e: any) {
      console.error('File upload error', e);
      const errorMsg = e instanceof Error ? e.message : 'Could not upload and index document.';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Upload Failed', errorMsg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      const res = await authFetch('/retrieve', {
        method: 'POST',
        body: JSON.stringify({
          query: searchQuery,
          topK: 5,
        }),
      });

      if (!res.ok) {
        throw new Error(`Search failed: HTTP ${res.status}`);
      }

      const data = await res.json(); // { chunks: [ { chunkId, sourceId, sourceType, sequence, content, distance, metadata } ] }
      const rawChunks = Array.isArray(data.chunks) ? data.chunks : [];

      const results: VectorResult[] = rawChunks.map((c: any) => ({
        chunkId: c.chunkId || 'chk_unknown',
        content: c.content || '',
        score: Math.max(0, Math.min(1.0, 1.0 - (c.distance || 0))), // Convert distance to similarity
        source: c.metadata?.filename || c.metadata?.name || c.sourceType || 'document',
        page: c.metadata?.range || c.metadata?.page || undefined,
      }));

      setSearchResults(results);
    } catch (e) {
      console.error('Vector search error', e);
      if (Platform.OS === 'web') {
        alert('Similarity search query failed. Ensure retrieval service is online.');
      } else {
        Alert.alert('Search Error', 'Vector similarity search query failed.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const embeddedCount = documents.filter(d => d.status === 'EMBEDDED').length;
  const totalChunks   = documents.reduce((a, d) => a + d.chunks, 0);
  const processingCount = documents.filter(d => d.status === 'PROCESSING').length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.primary }}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: 32, paddingTop: 32, paddingBottom: 24,
        borderBottomWidth: 1, borderBottomColor: theme.border.default,
        backgroundColor: theme.nav.bg,
      }}>
        <Text style={{ color: theme.text.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
          KNOWLEDGE BASE  /  DOCUMENT CENTER
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <View>
            <Text style={{ color: theme.text.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
              Document <Text style={{ color: theme.accent.primary }}>&</Text> Embedding Center
            </Text>
            <Text style={{ color: theme.text.secondary, fontSize: 12, marginTop: 4 }}>
              Upload documents · Monitor ETL pipeline · Test vector search
            </Text>
          </View>

          {/* Quick stats */}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { label: 'Embedded', value: embeddedCount, color: mode === 'dark' ? '#4ade80' : '#10b981' },
              { label: 'Chunks',   value: totalChunks,   color: theme.accent.primary },
              { label: 'Active',   value: processingCount, color: mode === 'dark' ? '#fbbf24' : '#d97706' },
            ].map((s, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 10, color: theme.text.muted, marginTop: 2 }}>{s.label}</Text>
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
            borderColor: pressed || hovered ? theme.accent.primary : (mode === 'dark' ? 'rgba(124,58,237,0.25)' : 'rgba(59,130,246,0.25)'),
            backgroundColor: pressed || hovered ? theme.nav.active : (mode === 'dark' ? 'rgba(124,58,237,0.02)' : 'rgba(59,130,246,0.02)'),
          }]}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="large" color={theme.accent.primary} />
              <Text style={{ color: theme.accent.primary, fontWeight: '600', fontSize: 13, marginTop: 12 }}>Uploading & queuing…</Text>
            </>
          ) : (
            <>
              <View style={{
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: mode === 'dark' ? 'rgba(124,58,237,0.12)' : 'rgba(59,130,246,0.1)',
                borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(124,58,237,0.25)' : 'rgba(59,130,246,0.2)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Text style={{ fontSize: 28, color: theme.accent.primary }}>⬆</Text>
              </View>
              <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 15, marginBottom: 6 }}>
                Drop files or click to upload
              </Text>
              <Text style={{ color: theme.text.secondary, fontSize: 12, textAlign: 'center', maxWidth: 380 }}>
                Supports PDF · DOCX · MD · TXT · YAML · CSV{'\n'}
                Documents are chunked and embedded via BGE-M3 through the Kafka ETL pipeline
              </Text>
              <View style={{
                marginTop: 16, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 24,
                backgroundColor: mode === 'dark' ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.1)',
                borderWidth: 1, borderColor: mode === 'dark' ? 'rgba(124,58,237,0.35)' : 'rgba(59,130,246,0.25)',
              }}>
                <Text style={{ color: mode === 'dark' ? '#c4b5fd' : '#1e40af', fontWeight: '700', fontSize: 12 }}>Select Files</Text>
              </View>
            </>
          )}
        </Pressable>

        {/* ── Tabs ── */}
        <View style={{
          flexDirection: 'row', marginBottom: 20,
          backgroundColor: theme.bg.card,
          borderRadius: 12, padding: 4,
          borderWidth: 1, borderColor: theme.border.default,
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
                backgroundColor: activeTab === tab.key ? theme.nav.active : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: activeTab === tab.key ? theme.accent.primary : theme.text.muted,
              }}>{tab.label}</Text>
              {tab.count > 0 && (
                <View style={{
                  width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: activeTab === tab.key 
                    ? (mode === 'dark' ? 'rgba(124,58,237,0.3)' : 'rgba(59,130,246,0.2)') 
                    : theme.border.default,
                }}>
                  <Text style={{ 
                    fontSize: 9, 
                    color: activeTab === tab.key ? theme.accent.primary : theme.text.muted, 
                    fontWeight: '700' 
                  }}>
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
            backgroundColor: theme.bg.card,
            borderRadius: 20, overflow: 'hidden',
            borderWidth: 1, borderColor: theme.border.default,
          }}>
            {/* Table header */}
            <View style={{
              flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: theme.border.default,
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}>
              {['Document', 'Type', 'Size', 'Chunks', 'Status', 'Uploaded'].map((h, i) => (
                <Text key={i} style={{
                  flex: i === 0 ? 3 : 1,
                  color: theme.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1,
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
                  borderBottomColor: theme.border.default,
                }}>
                  {/* Name */}
                  <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>{getFileIcon(doc.name)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text.primary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      {doc.embeddingTime && doc.embeddingTime !== '—' && (
                        <Text style={{ color: theme.text.muted, fontSize: 10, marginTop: 2, fontFamily: 'monospace' }}>
                          ⚡ {doc.embeddingTime} embed
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Type */}
                  <View style={{ flex: 1 }}>
                    <View style={{
                      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }}>
                      <Text style={{ color: theme.text.muted, fontSize: 9, fontWeight: '700', fontFamily: 'monospace' }}>
                        {doc.type}
                      </Text>
                    </View>
                  </View>
                  {/* Size */}
                  <Text style={{ flex: 1, color: theme.text.secondary, fontSize: 11, fontFamily: 'monospace' }}>{doc.size}</Text>
                  {/* Chunks */}
                  <Text style={{ 
                    flex: 1, 
                    color: doc.chunks > 0 ? theme.accent.primary : theme.text.muted, 
                    fontSize: 12, fontWeight: '600', fontFamily: 'monospace' 
                  }}>
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
                  </View>
                  {/* Uploaded */}
                  <Text style={{ flex: 1, color: theme.text.muted, fontSize: 10 }}>{doc.uploadedAt}</Text>
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
              backgroundColor: theme.bg.card,
              borderRadius: 16, padding: 4,
              borderWidth: 1, borderColor: theme.border.default,
            }}>
              <TextInput
                placeholder="Enter query to test similarity search against pgvector…"
                placeholderTextColor={theme.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                style={{
                  flex: 1, paddingHorizontal: 16, paddingVertical: 10,
                  color: theme.text.primary, fontSize: 13,
                } as any}
              />
              <Pressable
                onPress={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                style={({ pressed }) => ({
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: theme.accent.primary,
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
                backgroundColor: theme.bg.card,
                borderRadius: 16, borderWidth: 1, borderColor: theme.border.default,
              }}>
                <Text style={{ fontSize: 28, marginBottom: 10 }}>🔍</Text>
                <Text style={{ color: theme.text.primary, fontSize: 13, fontWeight: '600' }}>Vector Similarity Search</Text>
                <Text style={{ color: theme.text.secondary, fontSize: 11, textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
                  Enter a natural language query to test cosine similarity retrieval against your embedded pgvector index.
                </Text>
              </View>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <View>
                <Text style={{ color: theme.text.muted, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>
                  {searchResults.length} RESULTS  ·  BGE-M3  ·  COSINE SIMILARITY
                </Text>
                {searchResults.map((r, i) => (
                  <View key={i} style={{
                    backgroundColor: theme.bg.card,
                    borderRadius: 16, padding: 18, marginBottom: 12,
                    borderWidth: 1, borderColor: theme.border.default,
                  }}>
                    {/* Result header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 6,
                          backgroundColor: mode === 'dark' ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.15)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ color: theme.accent.primary, fontSize: 10, fontWeight: '700' }}>#{i + 1}</Text>
                        </View>
                        <Text style={{ color: theme.accent.primary, fontSize: 11, fontWeight: '600' }}>{r.source}</Text>
                        {r.page && (
                          <Text style={{ color: theme.text.muted, fontSize: 10, fontFamily: 'monospace' }}>p.{r.page}</Text>
                        )}
                      </View>
                      <Text style={{ color: theme.text.muted, fontSize: 10, fontFamily: 'monospace' }}>{r.chunkId}</Text>
                    </View>

                    <Text style={{ color: theme.text.primary, fontSize: 12, lineHeight: 19, marginBottom: 12 }}>{r.content}</Text>
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
