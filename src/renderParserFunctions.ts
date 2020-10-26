import { GeneratedFunctionMember } from './types/GeneratedMember';

export const renderParserFunctions = (): GeneratedFunctionMember[] => {
  return [
    {
      type: 'function',
      name: 'required',
      declaration: `export const required = <T>(
        parser: Parser<T | null | undefined>
      ): Parser<T> => (input: Json | undefined, path: string) => {
        const maybe = parser(input, path);
        if (typeof maybe === 'undefined' || maybe === null) {
          throw new ParseError(path, 'required');
        }
        return maybe;
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError']
    },
    {
      type: 'function',
      name: 'parseArray',
      declaration:
        `export const parseArray = <T>(parser: Parser<T | null | undefined>) => (
        input: Json | undefined,
        path: string
      ): Array<T> | null => {
        if (typeof input === 'undefined' || input === null) {
          return [];
        }
        if (typeof input !== 'object' || !Array.isArray(input)) {
          throw new ParseError(path, 'must be an array');
        }
        return input.map((item, index) => {
          const itemPath = ` +
        '`${path}[${index}]`' +
        `;
          const i = required(parser)(item, itemPath);
          return i;
        });
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError', 'required']
    },
    {
      type: 'function',
      name: 'parseString',
      declaration: `export const parseString: Parser<string | null | undefined> = (
        input: Json | undefined,
        path: string
      ) => {
        if (typeof input === 'undefined' || input === null) {
          return input;
        }
        if (typeof input !== 'string') {
          throw new ParseError(path, 'must be a string');
        }
        return input;
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError']
    },
    {
      type: 'function',
      name: 'parseNumber',
      declaration: `export const parseNumber: Parser<number | null | undefined> = (
        input: Json | undefined,
        path: string
      ) => {
        if (typeof input === 'undefined' || input === null) {
          return input;
        }
        if (typeof input !== 'number') {
          throw new ParseError(path, 'must be a number');
        }
        return input;
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError']
    },
    {
      type: 'function',
      name: 'parseBoolean',
      declaration: `export const parseBoolean: Parser<boolean | null | undefined> = (
        input: Json | undefined,
        path: string
      ) => {
        if (typeof input === 'undefined' || input === null) {
          return input;
        }
        if (typeof input !== 'boolean') {
          throw new ParseError(path, 'must be a number');
        }
        return input;
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError']
    },
    {
      type: 'function',
      name: 'parseEnum',
      declaration:
        `export const parseEnum = <T extends string>(
        values: T[]
      ): Parser<T | null | undefined> => (input: Json | undefined, path: string) => {
        if (typeof input === 'undefined' || input === null) {
          return input;
        }
        if (typeof input !== 'string') {
          throw new ParseError(path, 'must be a string');
        }
        if (!values.includes(input as T)) {
          throw new ParseError(path, ` +
        "`must be one of ${values.join(', ')}`" +
        `);
        }
        return input as T;
      };`,
      dependsOn: ['Parser', 'Json', 'ParseError']
    },
    {
      type: 'function',
      name: 'parseOneOf',
      declaration: `export const parseOneOf = <T>(
        operations: Parser<T | null | undefined>[]
      ): Parser<T | null | undefined> => {
        return (input: Json | undefined, path: string) => {
          let lastError: Error | null = null;
          for (let index = 0; index < operations.length; index++) {
            const element = operations[index];
            try {
              const candidate = element(input, path);
              if (typeof candidate !== 'undefined' && candidate !== null) {
                return candidate;
              }
            } catch (error) {
              lastError = error;
            }
          }
          if (lastError) {
            throw lastError;
          }
          return null;
        };
      };`,
      dependsOn: ['Parser', 'Json']
    },
    {
      type: 'function',
      name: 'parseQueryString',
      declaration: `export const parseQueryString = (
        input: undefined | string | string[] | ParsedQs | ParsedQs[],
        path: string
      ) => {
        if (typeof input === 'undefined' || input === null) {
          return null;
        }
        if (typeof input !== 'string') {
          throw new ParseError(path, 'must be a string');
        }
        return input;
      };`,
      dependsOn: ['ParseError'],
      imports: ["import { ParsedQs } from 'qs'"]
    }
  ];
};
