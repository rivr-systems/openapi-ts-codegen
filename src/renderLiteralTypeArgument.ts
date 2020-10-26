import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { LiteralTypeDefinition } from './types/TypeDefinition';
import { renderTypeArgument } from './renderTypeArgument';

export const renderLiteralTypeArgument = (
  def: LiteralTypeDefinition
): GeneratedTypeArgumentMember => {
  const properties = def.literal.properties.flatMap(p => ({
    ...p,
    typeArgument: renderTypeArgument(p.type)
  }));

  return {
    type: 'typeArgument',
    definition: `{${properties
      .map(({ name, typeArgument: { definition }, required }) =>
        required ? `${name}: ${definition}` : `${name}?: ${definition} | null`
      )
      .join(' ; ')}
    }`,
    dependsOn: properties.flatMap(p => p.typeArgument.dependsOn)
  };
};
