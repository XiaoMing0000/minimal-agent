import 'dotenv/config';

const CONFIG = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  DEEPSEEK_FLASH_MODEL: process.env.DEEPSEEK_FLASH_MODEL,
} as const;

export default CONFIG;
