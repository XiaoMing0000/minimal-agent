import { SSEData, parseSSELine } from './sse';

type Role = 'user' | 'assistant' | 'tool' | 'function' | 'system' | 'assistant';
interface ChatMessage {
  role: Role;
  content: string;
}

interface BaseChoice {
  index: number;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call';
  logprobs: number | null;
  system_fingerprint?: string | null;
  object?: string | null;
  moderation?: number;
  service_tier?: 'auto' | 'default' | 'flex';
}

interface ChatChoice extends BaseChoice {
  message: ResponseMessage;
}
interface StreamChatChoice extends BaseChoice {
  delta: ResponseMessage;
}

interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string | null;
  choices: Array<ChatChoice>;
  usage?: Usage;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: {
    cached_tokens: number;
  };
  completion_tokens_details: {
    reasoning_tokens: number;
  };
  prompt_cache_hit_tokens: number;
  prompt_cache_miss_tokens: number;
}

interface ResponseMessage {
  role: Role;
  content: string | Array<string>;
  reasoning_content: string | null;
}

/**
 * 参考文档：https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events
 */
export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string | null;
  choices: Array<StreamChatChoice>;
  logprobs: number | null;
  usage?: Usage;
  obfuscation?: string;
}

/**
 * SSE stream
 * @remarks 将SSE body转换为SSEData的异步生成器， 对 SSE 粘包数据进行拆包，然后并包处理
 * @param body SSE body
 * @returns
 */
async function* sseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEData> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    // 并包
    buffer += decoder.decode(value, { stream: !done });

    // 拆包
    const lines = buffer.split('\n\n');

    // 剩余数据用于下一轮处理，存储粘包数据
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      // 解析SSE line
      const event = parseSSELine(line);
      if (event) yield event;
    }

    if (done) {
      const event = parseSSELine(buffer);
      if (event) yield event;
      return;
    }
  }
}

/**
 * API Client
 * @remarks 封装API请求，支持Chat API
 */
export class ChatClient {
  constructor(
    readonly baseUrl: string,
    readonly apiKey: string,
    readonly model: string,
  ) {}

  /**
   * Chat API
   * @remarks 返回ChatCompletion
   * @param messages Chat messages
   * @returns ChatCompletion
   */
  async chat(messages: Array<ChatMessage>): Promise<ChatCompletion> {
    const res = await fetch(this.baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
      }),
    });

    const data = await res.json();
    return data as ChatCompletion;
  }

  /**
   * Stream Chat API
   * @remarks 流式返回ChatCompletionChunk, 使用 Generator 函数实现异步迭代，避免一次性返回所有数据，节省内存
   * @param messages Chat messages
   * @returns AsyncGenerator<ChatCompletionChunk>
   */
  async streamChat(messages: Array<ChatMessage>) {
    const { baseUrl, apiKey, model } = this;
    return async function* (): AsyncGenerator<ChatCompletionChunk> {
      const response = await fetch(baseUrl + '/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          // thinking: { type: 'disabled' },
          stream: true,
        }),
      });
      if (!response.body) {
        throw new Error('Response body is empty');
      }
      for await (const event of sseStream(response.body)) {
        if (event.type === 'data' && typeof event.data === 'object' && event.data !== null) {
          // 返回分块数据
          yield event.data as ChatCompletionChunk;
        }
      }
    };
  }
}
