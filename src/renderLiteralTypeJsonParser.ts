import { LiteralTypeDefinition } from './types/TypeDefinition';
import { GeneratedExpressionMember } from './types/GeneratedMember';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';

export const renderLiteralTypeJsonParser = (
  def: LiteralTypeDefinition
): GeneratedExpressionMember => {
  const properties = def.literal.properties.map(({ name, type, required }) => {
    const { definition, dependsOn } = renderJsonTypeParserExpression(type);
    const path = `path + '.${name}'`;
    const wrappedFn = required ? `required(${definition})` : definition;
    const parseFn = `${wrappedFn}(input['${name}'], ${path})`;
    return {
      definition: `${name}: ${parseFn}`,
      dependsOn
    };
  });

  return {
    type: 'expression',
    definition: `(input: Json | undefined, path: string) => {
      if (input === null || typeof input === 'undefined') {
        return input;
      }
      if (typeof input !== 'object' || Array.isArray(input)) {
        throw new ParseError(path, 'must be an object');
      }
      return {${properties.map(p => p.definition).join(',\n')}};
    }`,
    dependsOn: ['Json', 'ParseError', ...properties.flatMap(p => p.dependsOn)]
  };
};
