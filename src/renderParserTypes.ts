import { GeneratedTypeMember } from './types/GeneratedMember';

export const renderParserTypes = (): GeneratedTypeMember[] => {
  return [
    {
      type: 'type',
      name: 'ParseError',
      declaration:
        'export class ParseError extends Error { constructor(path: string, message: string) { super(`${path}: ${message}`); } }',
      dependsOn: []
    },
    {
      type: 'type',
      name: 'Parser',
      declaration: `export type Parser<T> = (input: Json | undefined, path: string) => T;`,
      dependsOn: ['Json']
    }
  ];
};
