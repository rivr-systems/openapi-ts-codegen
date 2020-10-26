import { LiteralTypeDefinition } from './types/TypeDefinition';
import { initCap } from './lib/ts-utils';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { ParameterObject } from './types/OpenAPIV3';
import { renderTypeArgument } from './renderTypeArgument';
import { parseParameterObject } from './parseParameterObject';
import { renderParametersParserDeclaration } from './renderParametersParserDeclaration';

export const renderParametersByType = (
  type: ParameterObject['in'],
  params: ParameterObject[],
  operationTypeName: string
): AnyGeneratedMember[] => {
  const properties = params.map(parseParameterObject);
  const dependencies = properties.flatMap(d => d.type.dependencies);
  const def: LiteralTypeDefinition = {
    literal: {
      properties,
      dependencies
    },
    dependencies
  };
  const name = `${operationTypeName}${initCap(type)}Parameters`;
  const { definition, dependsOn } = renderTypeArgument(def);
  return [
    {
      type: 'type',
      name,
      declaration: `export type ${name} = ${definition}`,
      dependsOn: [...dependencies, ...dependsOn]
    },
    ...renderParametersParserDeclaration(type, def, name)
  ];
};
