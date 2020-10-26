import { parseSchemaObject } from './parseSchemaObject';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { OperationObject } from './types/OpenAPIV3';
import { renderRequestBodyType } from './renderRequestBodyType';
import { renderRequestBodyParser } from './renderRequestBodyParser';

export const renderRequestBody = (
  operation: OperationObject,
  operationName: string
): AnyGeneratedMember[] => {
  const { requestBody } = operation;
  if (!requestBody) return [];
  if ('content' in requestBody) {
    const { content, required = false } = requestBody;
    if ('application/json' in content) {
      const { schema } = content['application/json'];
      if (schema) {
        const def = parseSchemaObject(schema);
        return [
          renderRequestBodyType(def, operationName, required),
          renderRequestBodyParser(def, operationName, required)
        ];
      }
    }
  }
  throw new Error(`Unsupported request body ${JSON.stringify(requestBody)}`);
};
