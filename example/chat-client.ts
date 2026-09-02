import CONFIG from '../src/config/config';
import { ChatClient } from '../src/core/chat-client';

const client = new ChatClient(CONFIG.DEEPSEEK_BASE_URL ?? '', CONFIG.DEEPSEEK_API_KEY ?? '', CONFIG.DEEPSEEK_FLASH_MODEL ?? '');

(async () => {
  console.log('流式处理：');
  let result = '';
  let reasoning = '';
  const stream = await client.streamChat(
    [
      { role: 'system', content: '你是一个知识问答助手。' },
      { role: 'user', content: '忘我生成一个200字左右的诗歌。有关春天的诗歌。' },
    ],
    { temperature: 1, thinking: { type: 'enabled' } },
  );
  for await (const chunk of stream()) {
    if (typeof chunk === 'string') {
      result += chunk;
      reasoning += chunk;
    } else {
      result += chunk.choices[0].delta.content ?? '';
      reasoning += chunk.choices[0].delta.reasoning_content ?? '';
    }
  }

  console.log('非流式处理：');
  const res = await client.chat([{ role: 'user', content: 'Hello, world!' }]);
  console.log(res);
  console.log(res.choices[0].message.content);
})();
