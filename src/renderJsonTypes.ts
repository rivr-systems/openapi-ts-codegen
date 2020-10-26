import { GeneratedTypeMember } from './types/GeneratedMember';

export const renderJsonTypes = (): GeneratedTypeMember[] => {
  return [
    {
      type: 'type',
      name: 'JsonPrimitive',
      declaration:
        'export type JsonPrimitive = string | number | boolean | null;',
      dependsOn: []
    },
    {
      type: 'type',
      name: 'JsonMap',
      declaration: `// eslint-disable-next-line @typescript-eslint/no-empty-interface
      export interface JsonMap
          extends Record<string, JsonPrimitive | JsonArray | JsonMap> {}`,
      dependsOn: ['JsonPrimitive', 'JsonArray', 'JsonMap']
    },
    {
      type: 'type',
      name: 'JsonArray',
      declaration: `// eslint-disable-next-line @typescript-eslint/no-empty-interface
      export interface JsonArray extends Array<JsonPrimitive | JsonArray | JsonMap> {}`,
      dependsOn: ['JsonPrimitive', 'JsonArray', 'JsonMap']
    },
    {
      type: 'type',
      name: 'Json',
      declaration: `export type Json = JsonPrimitive | JsonMap | JsonArray;`,
      dependsOn: ['JsonPrimitive', 'JsonMap', 'JsonArray']
    }
  ];
};
