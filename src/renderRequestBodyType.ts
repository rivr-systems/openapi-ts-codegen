import { GeneratedTypeMember } from './types/GeneratedMember';
import { renderTypeArgument } from './renderTypeArgument';
import { AnyTypeDefinition } from './types/TypeDefinition';

export const renderRequestBodyType = (
  def: AnyTypeDefinition,
  operationName: string,
  required: boolean
): GeneratedTypeMember => {
  const name = `${operationName}Body`;
  const { definition, dependsOn } = renderTypeArgument(def);
  return {
    type: 'type',
    name,
    declaration: `export type ${name} = ${definition} ${
      !required ? '| null' : ''
    }`,
    dependsOn: [...def.dependencies, ...dependsOn]
  };
};
