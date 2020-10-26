import { ParameterObject, ReferenceObject, Document } from './types/OpenAPIV3';

export const dereferenceParameter = (
  ref: ReferenceObject,
  doc: Document
): ParameterObject => {
  if (!ref.$ref.startsWith('#/components/parameters')) {
    throw new Error(`Invalid $ref ${ref.$ref}`);
  }
  const name = ref.$ref.substring(ref.$ref.lastIndexOf('/') + 1);
  const maybe = doc.components?.parameters?.[name];
  if (!maybe) throw new Error(`Failed to deference ${ref.$ref}`);
  if ('$ref' in maybe) {
    return dereferenceParameter(maybe, doc);
  }
  return maybe;
};
