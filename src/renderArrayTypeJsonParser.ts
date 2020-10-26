import { ArrayTypeDefinition } from './types/TypeDefinition';
import { GeneratedExpressionMember } from './types/GeneratedMember';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';

export const renderArrayTypeJsonParser = (
  def: ArrayTypeDefinition
): GeneratedExpressionMember => {
  const { definition, dependsOn } = renderJsonTypeParserExpression(def.array);
  return {
    type: 'expression',
    definition: `parseArray(${definition})`,
    dependsOn: ['parseArray', ...dependsOn]
  };
};
