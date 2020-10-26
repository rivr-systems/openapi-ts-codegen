import { renderTypeArgument } from './renderTypeArgument';
import { GeneratedTypeMember } from './types/GeneratedMember';
import { AnyTypeDefinition } from './types/TypeDefinition';

export const renderTypeDeclaration = (
  def: AnyTypeDefinition,
  name: string
): GeneratedTypeMember => {
  const { definition, dependsOn } = renderTypeArgument(def);
  return {
    type: 'type',
    name,
    declaration: `export type ${name} = ${definition}`,
    dependsOn: [...def.dependencies, ...dependsOn]
  };
};
