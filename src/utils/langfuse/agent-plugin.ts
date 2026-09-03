import { observe, type LangfuseObservationType } from '@langfuse/tracing';
import { Agent } from '../../core/agents';

/**
 * Langfuse 监控 Agent 请求探针插件
 */
class AgentPlugin {
  readonly module = 'agent';

  /**
   * 启动监控 Agent 方法
   */
  install(): void {
    this.interceptOperation(Agent, 'invoke', 'agent', 'agent.invoke');
  }

  /**
   * 拦截指定类的原型方法并包上 Langfuse observe
   * @param Cls Class 类名称，注意不是类的实例
   * @param operation 类内部的方法名称
   * @param asType Langfuse observation 类型
   * @param name Langfuse observation 名称
   */
  interceptOperation(Cls: any, operation: string, asType: LangfuseObservationType, name = operation): void {
    const _original = Cls.prototype[operation];
    if (!_original) return;

    Cls.prototype[operation] = observe(_original, {
      name,
      asType,
    });
  }
}

export default new AgentPlugin();
