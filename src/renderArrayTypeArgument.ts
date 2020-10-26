import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { ArrayTypeDefinition } from './types/TypeDefinition';
import { renderTypeArgument } from './renderTypeArgument';

export const renderArrayTypeArgument = (
  def: ArrayTypeDefinition
): GeneratedTypeArgumentMember => {
  const { definition, dependsOn } = renderTypeArgument(def.array);
  return {
    type: 'typeArgument',
    definition: `Array<${definition}>`,
    dependsOn
  };
};
