import { GeneratedFunctionMember } from './types/GeneratedMember';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';
import { AnyTypeDefinition } from './types/TypeDefinition';

export const renderRequestBodyParser = (
  def: AnyTypeDefinition,
  operationName: string,
  required: boolean
): GeneratedFunctionMember => {
  const name = `parse${operationName}Body`;
  const { definition, dependsOn } = renderJsonTypeParserExpression(def);
  const wrappedFn = required ? `required(${definition})` : definition;
  return {
    type: 'function',
    name,
    declaration: `export const ${name} = ${wrappedFn};`,
    dependsOn: [...def.dependencies, ...dependsOn, 'required']
  };
};
