import { GeneratedFunctionMember } from './types/GeneratedMember';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';
import { AnyTypeDefinition } from './types/TypeDefinition';

export const renderJsonTypeParserDeclaration = (
  def: AnyTypeDefinition,
  parserName: string,
  outputTypeName: string
): GeneratedFunctionMember => {
  const { definition, dependsOn } = renderJsonTypeParserExpression(def);
  return {
    type: 'function',
    name: parserName,
    declaration: `export const ${parserName}: Parser<${outputTypeName} | null | undefined> = ${definition};`,
    dependsOn: [
      ...def.dependencies.map(d => `parse${d}`),
      ...dependsOn,
      outputTypeName
    ]
  };
};
