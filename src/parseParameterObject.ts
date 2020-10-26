import { parseSchemaObject } from './parseSchemaObject';
import {
  AnyTypeDefinition,
  defaultTypeDefinition
} from './types/TypeDefinition';
import { ParameterObject } from './types/OpenAPIV3';

export type ParameterDefinition = {
  name: string;
  type: AnyTypeDefinition;
  required: boolean;
};

export const parseParameterObject = (
  param: ParameterObject
): ParameterDefinition => {
  const { name, required = false, schema } = param;
  const type = schema ? parseSchemaObject(schema) : defaultTypeDefinition;
  return {
    name,
    type,
    required
  };
};
