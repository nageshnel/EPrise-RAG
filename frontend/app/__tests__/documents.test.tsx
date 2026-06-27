import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import DocumentCenter from '../documents';
import * as DocumentPicker from 'expo-document-picker';
import { authFetch } from '../../utils/api';
import { useThemeStore } from '../../stores/themeStore';

// Mock DocumentPicker
jest.mock('expo-document-picker');

// Mock authFetch
jest.mock('../../utils/api', () => ({
  authFetch: jest.fn(),
}));

describe('DocumentCenter Screen', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'dark' });
    jest.clearAllMocks();
  });

  it('should render document list correctly by default', () => {
    const { getByText, getAllByText } = render(<DocumentCenter />);

    expect(getByText('corporate_security_policy.pdf')).toBeTruthy();
    expect(getByText('q3_earnings_report.docx')).toBeTruthy();
    // 4 status badges (all docs EMBEDDED) + 1 header stat chip label = 5 total occurrences
    expect(getAllByText('Embedded').length).toBe(5);
  });

  it('should trigger DocumentPicker and upload file successfully', async () => {
    const mockDocumentPickResult = {
      canceled: false,
      assets: [
        { uri: 'file://path/test_doc.pdf', name: 'test_doc.pdf', size: 1024 * 1024, mimeType: 'application/pdf' }
      ]
    };
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockDocumentPickResult);

    const mockUploadResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        documentId: 'new-doc-uuid-123',
        filename: 'test_doc.pdf',
        chunksPublished: 5,
      })
    };
    (authFetch as jest.Mock).mockResolvedValue(mockUploadResponse);

    const { getByText } = render(<DocumentCenter />);

    const uploadButton = getByText('Select Files');
    await act(async () => {
      fireEvent.press(uploadButton);
    });

    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: '*/*' })
    );
    expect(authFetch).toHaveBeenCalledWith(
      '/documents',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );

    // Verify document was added dynamically to the list
    expect(getByText('test_doc.pdf')).toBeTruthy();
    expect(getByText('1.00 MB')).toBeTruthy();
  });

  it('should navigate to search tab and perform semantic queries', async () => {
    const mockSearchResults = [
      { chunkId: '1', content: 'MFA requirements detail', distance: 0.08, metadata: { filename: 'policy.pdf' } }
    ];
    const mockSearchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        chunks: mockSearchResults
      })
    };
    (authFetch as jest.Mock).mockResolvedValue(mockSearchResponse);

    const { getByText, getByPlaceholderText } = render(<DocumentCenter />);

    // Click Search Playground Tab
    const searchTab = getByText('🔍  Vector Search');
    fireEvent.press(searchTab);

    const searchInput = getByPlaceholderText('Enter query to test similarity search against pgvector…');
    fireEvent.changeText(searchInput, 'MFA');

    const searchButton = getByText('Search');
    await act(async () => {
      fireEvent.press(searchButton);
    });

    expect(authFetch).toHaveBeenCalledWith(
      '/retrieve',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'MFA', topK: 5 })
      })
    );

    // Verify search result contents
    expect(getByText('MFA requirements detail')).toBeTruthy();
    expect(getByText('92.0%')).toBeTruthy(); // similarity score pct
  });
});
