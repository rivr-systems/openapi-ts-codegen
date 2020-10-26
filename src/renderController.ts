import { dereferenceParameter } from './dereferenceParameter';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { OperationObject, Document } from './types/OpenAPIV3';

export const renderController = (
  doc: Document,
  operation: OperationObject,
  operationName: string
): AnyGeneratedMember[] => {
  const { requestBody } = operation;
  if (requestBody && '$ref' in requestBody) {
    throw new Error('Ref in request body not supported (yet)!');
  }
  const name = `${operationName}Controller`;
  const handlerName = `${name}Handler`;
  const paramsName = `${operationName}Parameters`;
  const bodyName = `${operationName}Body`;
  const responseName = `${operationName}Response`;
  const paramTypes =
    operation.parameters
      ?.map(p => {
        if ('$ref' in p) {
          return dereferenceParameter(p, doc);
        }
        return p;
      })
      .map(p => p.in)
      .distinct() ?? [];
  return [
    {
      type: 'type',
      name: handlerName,
      declaration: `export type ${handlerName} = (input: { params: ${paramsName}${
        requestBody
          ? `, body: ${bodyName}${
              !requestBody.required ? '| null | undefined' : ''
            }`
          : ''
      } } | { error: ParseError }) => Promise<${responseName}>`,
      dependsOn: [paramsName, responseName]
    },
    {
      type: 'function',
      name,
      declaration: `export const ${name} = (handler: ${handlerName}): RequestHandler => {
        return async (req, res, next) => {
          const getInput = () => {
            try {
              const params = {
                ${[
                  ...(paramTypes.includes('header')
                    ? [`...parse${operationName}HeaderParameters(req.headers)`]
                    : []),

                  ...(paramTypes.includes('path')
                    ? [
                        `...required(parse${operationName}PathParameters)(req.params, 'path')`
                      ]
                    : []),

                  ...(paramTypes.includes('query')
                    ? [`...parse${operationName}QueryParameters(req.query)`]
                    : [])
                ].join(',\n')}
              };
              ${
                operation.requestBody
                  ? `const body = parse${operationName}Body(req.body, 'body');`
                  : ''
              }
              ${
                operation.requestBody
                  ? 'return { body, params };'
                  : 'return { params };'
              }
              
            } catch (error: unknown) {
              if (error instanceof ParseError) {
                return { error };
              }
              throw error;
            }
          };
          try {
            const response = await handler(getInput());
            res.status(response.status);
            if ('body' in response) {
              res.send(response.body);
            }
            res.end();
          } catch (error) {
            next(error);
          }
        };
      }`,
      dependsOn: [
        handlerName,
        ...(operation.requestBody
          ? [`parse${operationName}Body`, `${operationName}Body`]
          : []),
        ...(paramTypes.includes('header')
          ? [`parse${operationName}HeaderParameters`]
          : []),
        ...(paramTypes.includes('path')
          ? [`parse${operationName}PathParameters`]
          : []),
        ...(paramTypes.includes('query')
          ? [`parse${operationName}QueryParameters`]
          : [])
      ],
      imports: ["import { RequestHandler } from 'express';"]
    }
  ];
};
