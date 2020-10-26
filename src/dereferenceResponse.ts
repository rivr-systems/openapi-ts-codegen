import { ReferenceObject, Document, ResponseObject } from './types/OpenAPIV3';

export const dereferenceResponse = (
  ref: ReferenceObject,
  doc: Document
): ResponseObject => {
  if (!ref.$ref.startsWith('#/components/responses')) {
    throw new Error(`Invalid $ref ${ref.$ref}`);
  }
  const name = ref.$ref.substring(ref.$ref.lastIndexOf('/') + 1);
  const maybe = doc.components?.responses?.[name];
  if (!maybe) throw new Error(`Failed to deference ${ref.$ref}`);
  if ('$ref' in maybe) {
    return dereferenceResponse(maybe, doc);
  }
  return maybe;
};
