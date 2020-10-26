import * as OpenAPIV3 from './types/OpenAPIV3';
import { parseSchemaObject } from './parseSchemaObject';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { renderJsonTypeParserDeclaration } from './renderJsonTypeParserDeclaration';
import { renderTypeDeclaration } from './renderTypeDeclaration';

export function renderSchemaComponents(
  schemas: OpenAPIV3.ComponentsObject['schemas']
): AnyGeneratedMember[] {
  if (schemas) {
    return Object.keys(schemas)
      .compactMap(key => {
        const schema = schemas?.[key];
        if (schema) {
          const def = parseSchemaObject(schema);
          return [
            renderTypeDeclaration(def, key),
            renderJsonTypeParserDeclaration(def, `parse${key}`, key)
          ];
        }
      })
      .flatMap(f => f);
  }
  return [];
}
