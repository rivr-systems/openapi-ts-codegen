import { assertNever } from './lib/ts-utils';
import { CompositeTypeDefinition } from './types/TypeDefinition';
import { renderTypeArgument } from './renderTypeArgument';
import { GeneratedExpressionMember } from './types/GeneratedMember';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';

export const renderCompositeTypeJsonParser = (
  def: CompositeTypeDefinition
): GeneratedExpressionMember => {
  const members = def.members.map(m => renderJsonTypeParserExpression(m));
  const dependsOn = members.flatMap(m => m.dependsOn);
  if (def.type === 'allOf') {
    return {
      type: 'expression',
      definition: `(input: Json | undefined, path: string) => {
        return {
          ${members.map(m => `...(${m.definition})`).join(',')}
        };
      }`,
      dependsOn
    };
  }
  if (def.type === 'oneOf') {
    const { definition, dependsOn: typeDependsOn } = renderTypeArgument(def);
    return {
      type: 'expression',
      definition: `parseOneOf<${definition}>([
        ${members.map(m => m.definition).join(',')}
      ])`,
      dependsOn: [...dependsOn, 'parseOneOf', ...typeDependsOn]
    };
  }
  return assertNever(def.type);
};
