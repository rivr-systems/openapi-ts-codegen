import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { EnumTypeDefinition } from './types/TypeDefinition';

export const renderEnumTypeArgument = (
  def: EnumTypeDefinition
): GeneratedTypeArgumentMember => {
  return {
    type: 'typeArgument',
    definition: [
      ...def.enum.map(d => `'${d}'`),
      ...(def.nullable ? ['null'] : [])
    ].join('|'),
    dependsOn: []
  };
};
