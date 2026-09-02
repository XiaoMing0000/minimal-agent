// import z from 'zod';

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

export function tool<Args>(
  callback: (args: Args) => unknown,
  { name, description, schema }: { name: string; description: string; schema: z.ZodType<Args> },
) {
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
    callback: callback,
  };
}
