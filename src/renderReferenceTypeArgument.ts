import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { ReferenceTypeDefinition } from './types/TypeDefinition';

export const renderReferenceTypeArgument = (
  def: ReferenceTypeDefinition
): GeneratedTypeArgumentMember => {
  return {
    type: 'typeArgument',
    definition: def.reference,
    dependsOn: [def.reference]
  };
};
