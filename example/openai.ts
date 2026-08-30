import OpenAI from 'openai';
import CONFIG from '../src/config/config';

const client = new OpenAI({
  apiKey: CONFIG.DEEPSEEK_API_KEY, // This is the default and can be omitted
  baseURL: CONFIG.DEEPSEEK_BASE_URL,
});

const stream = await client.responses.create({
  model: CONFIG.DEEPSEEK_FLASH_MODEL,
  instructions: '你是一个知识问答助手。',
  input: '人类的平均寿命是多少?',
  stream: true,
});

let result = '';
for await (const chunk of stream) {
  // console.log(chunk);
  console.log(`type: ${chunk.type}`);
  console.log(`dalta: ${(chunk as any)?.delta}`);
  result += (chunk as any)?.delta ?? '';

  console.log(``);
}
console.log(`result: ${result}`);
