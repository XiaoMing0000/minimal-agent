export interface SSEData {
  type: 'data' | 'end' | 'id' | 'event' | 'retry';
  data?: string | any;
}

/**
 * 解析SSE line
 * @param line SSE line
 * @returns
 */
export function parseSSELine(line: string): SSEData | undefined {
  if (!line) return;

  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') return { type: 'end' };
    try {
      return { type: 'data', data: JSON.parse(data) };
    } catch {
      return { type: 'data', data };
    }
  }

  if (line.startsWith('id: ')) return { type: 'id', data: line.slice(4) };
  if (line.startsWith('event: ')) return { type: 'event', data: line.slice(7) };
  if (line.startsWith('retry: ')) return { type: 'retry', data: line.slice(7) };
}
