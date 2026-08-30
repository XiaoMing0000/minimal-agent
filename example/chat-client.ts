import CONFIG from '../src/config/config';
import { ChatClient } from '../src/entry/core/chat-client';

const client = new ChatClient(CONFIG.DEEPSEEK_BASE_URL ?? '', CONFIG.DEEPSEEK_API_KEY ?? '', CONFIG.DEEPSEEK_FLASH_MODEL ?? '');

(async () => {
  console.log('流式处理：');
  let result = '';
  const stream = await client.streamChat([{ role: 'user', content: 'Hello, world!' }]);
  for await (const chunk of stream()) {
    if (typeof chunk === 'string') {
      result += chunk;
    } else {
      console.log(JSON.stringify(chunk, null, 2));
      // console.log(chunk.choices[0].delta.content);
      result += chunk.choices[0].delta.content ?? '';
    }
  }
  console.log(result);

  console.log('非流式处理：');
  const res = await client.chat([{ role: 'user', content: 'Hello, world!' }]);
  console.log(res);
  console.log(res.choices[0].message.content);
})();
