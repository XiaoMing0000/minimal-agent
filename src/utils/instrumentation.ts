import 'dotenv/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import chatClientPlugin from './langfuse/chat-client-plugin';
import agentPlugin from './langfuse/agent-plugin';
import toolPlugin from './langfuse/tool-plugin';

const enabled = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

const langfuseSpanProcessor = new LangfuseSpanProcessor({
  exportMode: 'immediate',
});

const sdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
});

if (enabled) {
  sdk.start();
  chatClientPlugin.install();
  agentPlugin.install();
  toolPlugin.install();
}

process.on('SIGINT', async () => {
  if (!enabled) return;
  await langfuseSpanProcessor.forceFlush();
  process.exit(0);
});
