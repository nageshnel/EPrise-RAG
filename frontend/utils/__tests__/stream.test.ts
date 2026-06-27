import { xhr_sse_stream } from '../stream';
import * as api from '../api';

describe('xhr_sse_stream', () => {
  let mockXhr: any;
  let originalXMLHttpRequest: any;

  beforeAll(() => {
    jest.spyOn(api, 'getGatewayUrl').mockReturnValue('http://localhost:8080');
    jest.spyOn(api, 'getAuthToken').mockReturnValue('mock-token');
  });

  beforeEach(() => {
    mockXhr = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      abort: jest.fn(),
      readyState: 0,
      status: 0,
      responseText: '',
      onreadystatechange: null,
      onerror: null,
    };

    originalXMLHttpRequest = global.XMLHttpRequest;
    global.XMLHttpRequest = jest.fn().mockImplementation(() => mockXhr) as any;
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
  });

  it('should successfully establish XHR, set headers, and process stream chunks', async () => {
    const onEvent = jest.fn();
    const controller = new AbortController();

    const promise = xhr_sse_stream('/stream-test', { question: 'hello' }, controller.signal, onEvent);

    expect(mockXhr.open).toHaveBeenCalledWith('POST', 'http://localhost:8080/stream-test', true);
    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer mock-token');
    expect(mockXhr.send).toHaveBeenCalledWith(JSON.stringify({ question: 'hello' }));

    // Simulate readyState 3 (LOADING) with chunks
    mockXhr.readyState = 3;
    mockXhr.status = 200;
    
    // Chunk 1: Send sources event
    mockXhr.responseText = 'event: sources\ndata: ["doc1", "doc2"]\n\n';
    mockXhr.onreadystatechange();

    expect(onEvent).toHaveBeenCalledWith('sources', ['doc1', 'doc2']);

    // Chunk 2: Send content event
    mockXhr.responseText += 'event: content\ndata: "hello"\n\n';
    mockXhr.onreadystatechange();

    expect(onEvent).toHaveBeenCalledWith('content', 'hello');

    // Simulate readyState 4 (DONE)
    mockXhr.readyState = 4;
    mockXhr.onreadystatechange();

    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle networks errors and reject', async () => {
    const onEvent = jest.fn();
    const controller = new AbortController();

    const promise = xhr_sse_stream('/stream-test', {}, controller.signal, onEvent);

    mockXhr.onerror();

    await expect(promise).rejects.toThrow('XHR Network Error');
  });

  it('should reject on HTTP error codes', async () => {
    const onEvent = jest.fn();
    const controller = new AbortController();

    const promise = xhr_sse_stream('/stream-test', {}, controller.signal, onEvent);

    mockXhr.readyState = 4;
    mockXhr.status = 500;
    mockXhr.onreadystatechange();

    await expect(promise).rejects.toThrow('SSE stream failed: HTTP 500');
  });

  it('should handle abort signal aborting the connection', async () => {
    const onEvent = jest.fn();
    const controller = new AbortController();

    const promise = xhr_sse_stream('/stream-test', {}, controller.signal, onEvent);

    controller.abort();

    expect(mockXhr.abort).toHaveBeenCalled();
    await expect(promise).rejects.toThrow('AbortError');
  });
});
