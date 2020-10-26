import { AnyTypeDefinition } from './types/TypeDefinition';
import * as OpenAPIV3 from './types/OpenAPIV3';

export function parseSchemaObject(
  schema:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ArraySchemaObject
    | OpenAPIV3.NonArraySchemaObject
): AnyTypeDefinition {
  if ('oneOf' in schema) {
    const members = schema.oneOf?.map(s => parseSchemaObject(s)) ?? [];
    return {
      members,
      type: 'oneOf',
      dependencies: members.flatMap(m => m.dependencies)
    };
  }
  if ('allOf' in schema) {
    const members = schema.allOf?.map(s => parseSchemaObject(s)) ?? [];
    return {
      members,
      type: 'allOf',
      dependencies: members.flatMap(m => m.dependencies)
    };
  }
  if ('$ref' in schema) {
    const name = schema.$ref.substring(schema.$ref.lastIndexOf('/') + 1);
    return {
      reference: name,
      dependencies: [name]
    };
  }
  switch (schema.type) {
    case 'boolean':
    case 'number':
      return {
        builtIn: schema.type,
        dependencies: []
      };
    case 'integer':
      return { builtIn: 'number', dependencies: [] };
    case 'string':
      if (schema.enum) {
        const values = schema.enum.map(e => e as string);
        return {
          enum: values.filter(e => e !== 'null'),
          nullable: values.includes('null'),
          dependencies: []
        };
      }
      return {
        builtIn: schema.type,
        dependencies: []
      };
    case 'object':
      const properties = Object.keys(schema?.properties ?? {}).compactMap(
        name => {
          const property = schema.properties?.[name];
          if (property) {
            const type = parseSchemaObject(property);
            const required = schema.required?.includes(name) ?? false;
            return { name, type, required };
          }
        }
      );
      const dependencies = properties.flatMap(p => p.type.dependencies);
      return {
        literal: {
          dependencies,
          properties
        },
        dependencies
      };
    case 'array':
      const type = parseSchemaObject(schema.items);
      return {
        array: type,
        dependencies: type.dependencies
      };
    default:
      throw new Error(`Unrecognised schema type ${schema.type}`);
  }
}
