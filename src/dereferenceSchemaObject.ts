import { ReferenceObject, Document, SchemaObject } from './types/OpenAPIV3';

export const dereferenceSchemaObject = (
  ref: ReferenceObject,
  doc: Document
): SchemaObject => {
  if (!ref.$ref.startsWith('#/components/schemas')) {
    throw new Error(`Invalid $ref ${ref.$ref}`);
  }
  const name = ref.$ref.substring(ref.$ref.lastIndexOf('/') + 1);
  const maybe = doc.components?.schemas?.[name];
  if (!maybe) throw new Error(`Failed to deference ${ref.$ref}`);
  if ('$ref' in maybe) {
    return dereferenceSchemaObject(maybe, doc);
  }
  return maybe;
};
