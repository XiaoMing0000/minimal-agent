import { observe } from '@langfuse/tracing';
import { ToolFactory } from '../../core/tools';

/**
 * Langfuse 监控 Tool 请求探针插件
 */
class ToolPlugin {
  readonly module = 'tool';

  /**
   * 启动监控 ToolFactory 静态方法
   */
  install(): void {
    this.interceptOperation(ToolFactory, 'create');
  }

  /**
   * 拦截指定类的静态方法，将返回的 callback 包上 Langfuse observe
   * @param Cls Class 类名称，注意不是类的实例
   * @param operation 类的静态方法名称
   */
  interceptOperation(Cls: any, operation: string): void {
    const _original = Cls[operation];
    if (!_original) return;

    Cls[operation] = function (...args: any[]) {
      const result = _original.apply(this, args);
      return {
        ...result,
        callback: observe(result.callback, {
          name: `Tool: ${result.name}`,
          asType: 'tool',
        }),
      };
    };
  }
}

export default new ToolPlugin();
