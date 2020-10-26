import { OperationObject, Document } from './types/OpenAPIV3';
import { renderParameters } from './renderParameters';
import { renderRequestBody } from './renderRequestBody';
import { renderResponses } from './renderResponses';
import { renderController } from './renderController';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { renderOperationClient } from './renderOperationClient';

export const renderOperation = (
  method: string,
  operation: OperationObject,
  operationName: string,
  doc: Document,
  path: string
): AnyGeneratedMember[] => {
  const { operationId, parameters } = operation;
  if (!operationId || operationId.length === 0) {
    throw new Error('operationId required');
  }
  return [
    ...renderParameters(parameters, operationName, doc),
    ...renderRequestBody(operation, operationName),
    ...renderResponses(doc, operation, operationName),
    ...renderController(doc, operation, operationName),
    ...renderOperationClient(
      method,
      doc,
      operation,
      operationName,
      operationId,
      path
    )
  ];
};
