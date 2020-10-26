import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { BuiltInTypeDefinition } from './types/TypeDefinition';

export const renderBuiltInTypeArgument = (
  def: BuiltInTypeDefinition
): GeneratedTypeArgumentMember => {
  return {
    type: 'typeArgument',
    definition: def.builtIn,
    dependsOn: []
  };
};
