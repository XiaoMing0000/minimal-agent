import { observe, type LangfuseObservationType } from '@langfuse/tracing';
import { ChatClient } from '../../core/chat-client';

/**
 * Langfuse 监控 ChatClient 请求探针插件
 */
class ChatClientPlugin {
  readonly module = 'chat-client';

  /**
   * 启动监控 ChatClient 方法
   */
  install(): void {
    this.interceptOperation(ChatClient, 'chat', 'generation');
    this.interceptOperation(ChatClient, 'streamChat', 'generation');
  }

  /**
   * 拦截指定类的原型方法并包上 Langfuse observe
   * @param Cls Class 类名称，注意不是类的实例
   * @param operation 类内部的方法名称
   * @param asType Langfuse observation 类型
   */
  interceptOperation(Cls: any, operation: string, asType: LangfuseObservationType): void {
    const _original = Cls.prototype[operation];
    if (!_original) return;

    Cls.prototype[operation] = observe(_original, {
      name: operation,
      asType,
    });
  }
}

export default new ChatClientPlugin();
