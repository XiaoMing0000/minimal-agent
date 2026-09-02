import { runTasks } from '../utils/utils';
import { ChatClient, ChatMessage, ChatOptions } from './chat-client';
import { Tool } from './tools';

interface AgentOptions {
  client: ChatClient;
  tools: Array<Tool>;
}

interface AgentRunTimes {
  loopRemaining?: number; // agent 循环深度限制， default 15
  maxToolCallLimit?: number; // 工具调用并发限制， default 5
}

export class Agent {
  private client: ChatClient;
  private tools: Array<Tool>;
  constructor(options: AgentOptions) {
    this.client = options.client;
    this.tools = options.tools;
  }

  async invoke(
    messages: Array<ChatMessage>,
    options?: ChatOptions,
    { maxToolCallLimit = 5, loopRemaining = 15 }: AgentRunTimes = {},
  ): Promise<ChatMessage[]> {
    const invokeMessages = [...messages];
    const res = await this.client.chat(messages, {
      ...(options ?? {}),
      tools: [...this.tools.map((tool) => tool.schema), ...(options?.tools ?? [])],
    });
    // 调用工具
    const assistantMessage = res.choices[0].message;
    const toolCalls = assistantMessage.tool_calls;
    // 记录 AI 的回复
    invokeMessages.push({
      role: 'assistant',
      content: Array.isArray(assistantMessage.content) ? assistantMessage.content.join('') : assistantMessage.content,
      tool_calls: toolCalls,
    });
    if (toolCalls) {
      // 创建调用工具任务
      const tasks = [];
      for (const toolCall of toolCalls) {
        // 获取工具
        const tool = this.tools.find((tool) => tool.name === toolCall.function.name);
        if (tool) {
          // 调用工具
          tasks.push(async () => {
            const result = await tool.callback(
              tool.schema.function.parameters?.type === 'object' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments,
            );
            // 记录工具调用结果
            invokeMessages.push({
              role: 'tool',
              name: tool.name,
              tool_call_id: toolCall.id,
              content: JSON.stringify(result ?? null),
            });
          });
        }
      }
      // 并发调用工具
      await runTasks(tasks, maxToolCallLimit);

      // 调用工具后，需要重新调用模型，获取最终结果
      if (loopRemaining > 0) {
        return await this.invoke(invokeMessages, options, { maxToolCallLimit, loopRemaining: --loopRemaining });
      }
      throw new Error(`agent loop deep limit reached: ${loopRemaining}`);
    }
    return invokeMessages;
  }
}
