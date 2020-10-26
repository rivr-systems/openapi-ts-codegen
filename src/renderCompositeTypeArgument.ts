import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { CompositeTypeDefinition } from './types/TypeDefinition';
import { renderTypeArgument } from './renderTypeArgument';

export const renderCompositeTypeArgument = (
  def: CompositeTypeDefinition
): GeneratedTypeArgumentMember => {
  const members = def.members.map(m => renderTypeArgument(m));
  return {
    type: 'typeArgument',
    definition: members
      .map(m => m.definition)
      .join(def.type === 'allOf' ? '&' : '|'),
    dependsOn: members.flatMap(m => m.dependsOn)
  };
};
