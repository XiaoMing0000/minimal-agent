# minimal-agent

English | [简体中文](./README.md)

A minimal LLM agent: a self-implemented ChatClient for Chat Completions, Zod-defined tools, and a ReAct-style tool-calling loop.

## Features

- **Agent loop** — call the model → run tools → call the model again until there are no `tool_calls`
- **Tool definition** — `tool()` turns a Zod schema into function calling
- **Concurrent tools** — multiple tool calls in one turn can run in parallel (default cap: 5)
- **ChatClient** — non-streaming and SSE streaming `/v1/chat/completions`
- **Langfuse tracing** — optional observability for Agent / Generation / Tool chains
- **TypeScript + esbuild** — strict mode, bundled output in `dist/`

## Requirements

| Tool    | Version    |
| ------- | ---------- |
| Node.js | >= 22.13.0 |
| pnpm    | >= 11.23.0 |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/XiaoMing0000/minimal-agent.git
cd minimal-agent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

Fill in `.env` with a DeepSeek base URL, API key, and model, then start:

```bash
pnpm dev
```

The default entry `src/entry/index.ts` registers a `get_weather` demo tool and asks the agent for the weather in Shenzhen and Xi'an.

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Dev mode with file watching and auto-restart |
| `pnpm dev:unwatch` | Run the entry with tsx, no file watching     |
| `pnpm build`       | Bundle with esbuild into `dist/`             |
| `pnpm start`       | Run the built output                         |
| `pnpm lint:check`  | oxlint + TypeScript type checking            |
| `pnpm fmt`         | Format code with oxfmt                       |

## Project Structure

```
minimal-agent/
├── config/
│   └── esbuild.config.mts   # esbuild build config
├── src/
│   ├── config/config.ts     # environment variables
│   └── entry/
│       ├── index.ts         # demo entry (weather agent)
│       ├── core/
│       │   ├── agents.ts    # agent loop
│       │   ├── chat-client.ts
│       │   ├── tools.ts     # tool definitions
│       │   └── sse.ts       # SSE parser
│       └── utils/utils.ts   # concurrent task queue
├── example/                   # ChatClient samples
├── dist/                      # build output
├── .env.example               # environment variable template
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values as needed:

```bash
cp .env.example .env
```

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `DEEPSEEK_API_KEY`     | API key                              |
| `DEEPSEEK_BASE_URL`    | Base URL of the Chat Completions API |
| `DEEPSEEK_MODEL`       | Default model                        |
| `DEEPSEEK_FLASH_MODEL` | Model used by the demo entry         |
| `LANGFUSE_PUBLIC_KEY`  | Langfuse public key (skip if empty)  |
| `LANGFUSE_SECRET_KEY`  | Langfuse secret key                  |
| `LANGFUSE_BASE_URL`    | Langfuse endpoint (cloud by default) |

`ChatClient` requests `{baseUrl}/v1/chat/completions`, so the base URL should not include that path suffix.

With Langfuse configured, a full agent run appears as a trace in the console, for example:

![Langfuse Tracing](./docs/images/langfuse-tracing.png)

## Core Usage

```ts
import { z } from 'zod';
import { Agent } from './core/agents';
import { ChatClient } from './core/chat-client';
import { tool } from './core/tools';

const weatherTool = tool(({ city }) => ({ weather: `${city} 的天气是晴天。` }), {
  name: 'get_weather',
  description: '查询指定城市当前天气',
  schema: z.object({
    city: z.string().describe('需要查询天气的城市'),
  }),
});

const client = new ChatClient(baseUrl, apiKey, model);
const agent = new Agent({ client, tools: [weatherTool] });

const messages = await agent.invoke([
  { role: 'system', content: '你是一个天气助手。' },
  { role: 'user', content: '查询深圳当前天气' },
]);
```

`invoke` defaults to a loop depth of 15 and a tool concurrency of 5. Override them via the third argument.

To call the model without the agent loop, use `ChatClient` directly:

```ts
const client = new ChatClient(baseUrl, apiKey, model);
const res = await client.chat([{ role: 'user', content: 'Hello' }]);
```

See `example/chat-client.ts` for a streaming example.

## Code Quality

| Hook         | Action                                      |
| ------------ | ------------------------------------------- |
| `pre-commit` | lint-staged: oxfmt + oxlint --fix           |
| `commit-msg` | changelog check                             |
| `pre-push`   | `pnpm run fmt:check && pnpm run lint:check` |

## Tech Stack

| Category    | Dependencies                                   |
| ----------- | ---------------------------------------------- |
| Runtime     | Node.js                                        |
| Language    | TypeScript                                     |
| LLM         | Self-implemented ChatClient (Chat Completions) |
| Tool schema | Zod                                            |
| Bundler     | esbuild                                        |
| Linting     | oxlint, tsc                                    |
| Formatting  | oxfmt                                          |

## License

[MIT](./LICENSE)

## Author

[xiaoming0000](https://github.com/XiaoMing0000)
