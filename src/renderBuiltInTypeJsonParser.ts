import { initCap } from './lib/ts-utils';
import { BuiltInTypeDefinition } from './types/TypeDefinition';
import { GeneratedExpressionMember } from './types/GeneratedMember';

export const renderBuiltInTypeJsonParser = (
  def: BuiltInTypeDefinition
): GeneratedExpressionMember => {
  const definition = `parse${initCap(def.builtIn)}`;
  return {
    type: 'expression',
    definition,
    dependsOn: [definition]
  };
};
