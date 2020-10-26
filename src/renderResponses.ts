import { parseSchemaObject } from './parseSchemaObject';
import {
  AnyGeneratedMember,
  GeneratedFunctionMember,
  GeneratedTypeMember
} from './types/GeneratedMember';
import { OperationObject, Document } from './types/OpenAPIV3';
import { dereferenceResponse } from './dereferenceResponse';
import { renderTypeDeclaration } from './renderTypeDeclaration';
import { renderJsonTypeParserDeclaration } from './renderJsonTypeParserDeclaration';

export const renderResponses = (
  doc: Document,
  operation: OperationObject,
  operationName: string
): AnyGeneratedMember[] => {
  const { responses: rawResponses } = operation;

  if (!rawResponses) return [];

  const responses = Object.keys(rawResponses).map(statusCode => {
    const response = rawResponses[statusCode];
    if ('$ref' in response) {
      return { statusCode, response: dereferenceResponse(response, doc) };
    }
    return { statusCode, response };
  });

  const allResponseStuff = responses.flatMap(({ statusCode, response }) => {
    const { content } = response;
    const responseTypeName = `${operationName}${statusCode}Response`;
    if (!content) {
      return [
        {
          type: 'type',
          name: responseTypeName,
          declaration: `export type ${responseTypeName} = { status: ${statusCode} }`,
          dependsOn: []
        },
        {
          type: 'function',
          name: `parse${responseTypeName}`,
          declaration: `export const parse${responseTypeName} = (body: Json): ${responseTypeName} => {
            return {
              status: ${statusCode}
            };
          }`,
          dependsOn: []
        }
      ] as (GeneratedTypeMember | GeneratedFunctionMember)[];
    }
    if ('application/json' in content) {
      const { schema } = content['application/json'];
      if (schema) {
        const def = parseSchemaObject(schema);
        const responseBodyTypeName = `${responseTypeName}Body`;
        const parserName = `parse${responseBodyTypeName}`;
        return [
          renderTypeDeclaration(def, responseBodyTypeName),
          renderJsonTypeParserDeclaration(
            def,
            parserName,
            responseBodyTypeName
          ),
          {
            type: 'type',
            name: responseTypeName,
            declaration: `export type ${responseTypeName} = { status: ${statusCode}; body: ${responseBodyTypeName}}`,
            dependsOn: [responseBodyTypeName]
          },
          {
            type: 'function',
            name: `parse${responseTypeName}`,
            declaration: `export const parse${responseTypeName} = (body: Json): ${responseTypeName} => {
              return {
                status: ${statusCode},
                body: required(${parserName})(body, 'body')
              };
            }`,
            dependsOn: [responseTypeName, 'required']
          }
        ] as (GeneratedTypeMember | GeneratedFunctionMember)[];
      }
    }
    throw new Error(
      `Unsupported media type ${JSON.stringify(
        content
      )} ${operationName} ${statusCode}`
    );
  });
  const responseTypes = responses.map(
    ({ statusCode }) => `${operationName}${statusCode}Response`
  );
  const unionName = `${operationName}Response`;
  const union: GeneratedTypeMember = {
    type: 'type',
    name: unionName,
    declaration: `export type ${unionName} = ${responseTypes.join('|')}`,
    dependsOn: responseTypes
  };
  return [...allResponseStuff, union];
};
