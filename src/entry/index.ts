import CONFIG from '../config/config';
import { Agent } from './core/agents';
import { ChatClient } from './core/chat-client';

import { z } from 'zod';
import { tool } from './core/tools';

const weatherTool = tool(
  ({ city }) => {
    return {
      weather: `${city} 的天气是晴天。`,
    };
  },
  {
    name: 'get_weather',
    description: '查询指定城市当前天气',
    schema: z.object({
      city: z.string().describe('需要查询天气的城市'),
    }),
  },
);

const emailTool = tool(
  ({ message }) => {
    console.log('in email tool: ', message);
    return {
      weather: `邮件内容：${message}。`,
    };
  },
  {
    name: 'send_email',
    description: '向用户发送邮件信息。',
    schema: z.object({
      message: z.string().describe('邮件信息'),
    }),
  },
);

const client = new ChatClient(CONFIG.DEEPSEEK_BASE_URL ?? '', CONFIG.DEEPSEEK_API_KEY ?? '', CONFIG.DEEPSEEK_FLASH_MODEL ?? '');
const agent = new Agent({ client, tools: [weatherTool, emailTool] });

(async () => {
  const res = await agent.invoke(
    [
      { role: 'system', content: '你是一个天气助手，帮助用户查询指定城市当前天气，并发送邮件给用户。' },
      { role: 'user', content: '查询深圳当前天气，并发送邮件给用户' },
    ],
    {
      temperature: 0,
      thinking: { type: 'enabled' },
    },
  );
  const resData = res.at(-1);
  console.log('resData: ', resData);
})();
