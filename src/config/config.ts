import 'dotenv/config';

const CONFIG = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  DEEPSEEK_FLASH_MODEL: process.env.DEEPSEEK_FLASH_MODEL,

  // 千问
  QWEN_BASE_URL: process.env.QWEN_BASE_URL ?? '',
  QWEN_API_KEY: process.env.QWEN_API_KEY ?? '',
  QWEN_MODEL: process.env.QWEN_MODEL ?? '',
  QWEN_EMBEDDINGS_MODEL: process.env.QWEN_EMBEDDINGS_MODEL ?? '',
  QWEN_RE_RANKER_MODEL: process.env.QWEN_RE_RANKER_MODEL ?? '',
} as const;

export default CONFIG;
