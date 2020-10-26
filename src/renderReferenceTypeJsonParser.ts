import { ReferenceTypeDefinition } from './types/TypeDefinition';
import { GeneratedExpressionMember } from './types/GeneratedMember';

export const renderReferenceTypeJsonParser = (
  def: ReferenceTypeDefinition
): GeneratedExpressionMember => {
  const definition = `parse${def.reference}`;
  return {
    type: 'expression',
    definition,
    dependsOn: [definition]
  };
};
