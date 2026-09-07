import { observe, startObservation, updateActiveObservation } from '@langfuse/tracing';
import { ChatClient, type ChatOptions, type Usage } from '../../core/chat-client';

/**
 * 将 Provider usage 转为 Langfuse 互斥桶 usageDetails。
 * input/output 不含 cache / reasoning，避免 UI 与费用双重计数。
 */
function toUsageDetails(usage?: Usage): Record<string, number> | undefined {
  if (!usage) return undefined;

  const cached = usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens ?? 0;
  const reasoning = usage.completion_tokens_details?.reasoning_tokens ?? 0;
  const details: Record<string, number> = {
    input: Math.max(0, usage.prompt_tokens - cached),
    output: Math.max(0, usage.completion_tokens - reasoning),
    total: usage.total_tokens,
  };

  if (cached > 0) details.input_cached_tokens = cached;
  if (reasoning > 0) details.output_reasoning_tokens = reasoning;

  return details;
}

function buildModelParameters(options?: ChatOptions): Record<string, string | number> | undefined {
  if (!options) return undefined;

  const params: Record<string, string | number> = {};
  if (options.temperature !== undefined) params.temperature = options.temperature;
  if (options.reasoning_effort !== undefined) params.reasoning_effort = options.reasoning_effort;
  if (options.thinking?.type !== undefined) params.thinking = options.thinking.type;

  return Object.keys(params).length > 0 ? params : undefined;
}

/**
 * Langfuse 监控 ChatClient 请求探针插件
 */
class ChatClientPlugin {
  readonly module = 'chat-client';

  /**
   * 启动监控 ChatClient 方法
   */
  install(): void {
    this.interceptChat();
    this.interceptStreamChat();
  }

  /**
   * 拦截 chat：在 observe generation 内上报 usageDetails
   */
  interceptChat(): void {
    const _original = ChatClient.prototype.chat;
    if (!_original) return;

    ChatClient.prototype.chat = observe(
      async function (this: ChatClient, options: ChatOptions) {
        const result = await _original.call(this, options);
        const usageDetails = toUsageDetails(result.usage);
        const modelParameters = buildModelParameters(options);

        updateActiveObservation(
          {
            model: result.model ?? options.model ?? this.model,
            ...(modelParameters ? { modelParameters } : {}),
            ...(usageDetails ? { usageDetails } : {}),
          },
          { asType: 'generation' },
        );

        return result;
      },
      { name: 'LLM: chat', asType: 'generation' },
    );
  }

  /**
   * 拦截 streamChat：generation 需覆盖整个流消费过程，结束后再上报 usage
   */
  interceptStreamChat(): void {
    const _original = ChatClient.prototype.streamChat;
    if (!_original) return;

    ChatClient.prototype.streamChat = async function (this: ChatClient, options: ChatOptions) {
      const modelParameters = buildModelParameters(options);
      const observation = startObservation(
        'LLM: streamChat',
        {
          input: { options },
          model: options.model ?? this.model,
          ...(modelParameters ? { modelParameters } : {}),
        },
        { asType: 'generation' },
      );

      try {
        const createGenerator = await _original.call(this, options);
        const fallbackModel = options.model ?? this.model;

        return async function* () {
          let lastUsage: Usage | undefined;
          let model = fallbackModel;

          try {
            for await (const chunk of createGenerator()) {
              if (chunk.model) model = chunk.model;
              if (chunk.usage) lastUsage = chunk.usage;
              yield chunk;
            }

            const usageDetails = toUsageDetails(lastUsage);
            observation.update({
              model,
              ...(usageDetails ? { usageDetails } : {}),
            });
          } catch (error) {
            observation.update({
              level: 'ERROR',
              statusMessage: error instanceof Error ? error.message : String(error),
            });
            throw error;
          } finally {
            observation.end();
          }
        };
      } catch (error) {
        observation.update({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : String(error),
        });
        observation.end();
        throw error;
      }
    };
  }
}

export default new ChatClientPlugin();
