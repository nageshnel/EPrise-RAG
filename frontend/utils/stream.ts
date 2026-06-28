import { getGatewayUrl, getAuthToken } from './api';

export type SseEventType = 'sources' | 'content' | 'done';

export async function xhr_sse_stream(
  path: string,
  payload: Record<string, unknown>,
  signal: AbortSignal,
  on_event: (event_type: SseEventType, data: unknown) => void
): Promise<void> {
  const access_token = getAuthToken();
  const gatewayUrl = getGatewayUrl();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${gatewayUrl}${path}`, true);

    xhr.setRequestHeader('Content-Type', 'application/json');
    if (access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${access_token}`);
    }

    let processed_length = 0;
    let current_event: SseEventType | '' = '';
    let buffer = '';

    const handle_abort = () => {
      xhr.abort();
      signal.removeEventListener('abort', handle_abort);
      reject(new Error('AbortError'));
    };
    signal.addEventListener('abort', handle_abort);

    xhr.onreadystatechange = () => {
      // readyState 3 (LOADING) - Receiving chunked data
      if (xhr.readyState === 3 && xhr.status === 200) {
        const new_text = xhr.responseText.substring(processed_length);
        processed_length = xhr.responseText.length;
        buffer += new_text;

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete line

        for (const line of lines) {
          const trimmed_line = line.trim();
          if (trimmed_line.startsWith('event:')) {
            current_event = trimmed_line.slice(6).trim() as SseEventType;
          } else if (trimmed_line.startsWith('data:')) {
            const data_str = trimmed_line.slice(5).trim();
            if (data_str && current_event) {
              try {
                const data = current_event === 'content' ? data_str : JSON.parse(data_str);
                on_event(current_event, data);
              } catch (e) {
                // Ignore malformed chunks
              }
              current_event = '';
            }
          } else if (trimmed_line === '') {
            current_event = '';
          }
        }
      }

      // readyState 4 (DONE)
      if (xhr.readyState === 4) {
        signal.removeEventListener('abort', handle_abort);
        if (xhr.status !== 200 && xhr.status !== 0) {
          reject(new Error(`SSE stream failed: HTTP ${xhr.status}`));
        } else {
          resolve();
        }
      }
    };

    xhr.onerror = () => {
      signal.removeEventListener('abort', handle_abort);
      reject(new Error('XHR Network Error'));
    };

    xhr.send(JSON.stringify(payload));
  });
}
