import z from 'zod';

export interface ToolSchema {
  type: 'function';
  function: {
    type: 'function';
    name: string;
    description: string;
    parameters: { [key: string]: unknown };
  };
}

export interface ToolCall {
  id: string;
  index: number;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  name: string;
  schema: ToolSchema;
  callback: (args: any) => unknown;
}

/**
 * 工具工厂
 * @remarks 使用静态方法创建 Tool，导出的 tool 在调用时转发到该类，便于探针拦截
 */
export class ToolFactory {
  /**
   * 将 Zod schema 转成 function calling 工具
   */
  static create<Args>(
    callback: (args: Args) => unknown,
    { name, description, schema }: { name: string; description: string; schema: z.ZodType<Args> },
  ): Tool {
    const jsonSchema = schema.toJSONSchema();
    const toolSchema: ToolSchema = {
      type: 'function',
      function: {
        type: 'function',
        name: name,
        description: description,
        parameters: jsonSchema,
      },
    };
    return {
      name: toolSchema.function.name,
      schema: toolSchema,
      callback,
    };
  }
}

export const tool: typeof ToolFactory.create = (callback, options) => ToolFactory.create(callback, options);
