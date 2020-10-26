import { AnyTypeDefinition } from './types/TypeDefinition';
import { GeneratedFunctionMember } from './types/GeneratedMember';
import { ParameterObject } from './types/OpenAPIV3';
import { renderHeaderTypeParserDeclaration } from './renderHeaderTypeParserDeclaration';
import { renderQueryTypeParserDeclaration } from './renderQueryTypeParserDeclaration';
import { renderJsonTypeParserDeclaration } from './renderJsonTypeParserDeclaration';

export const renderParametersParserDeclaration = (
  type: ParameterObject['in'],
  def: AnyTypeDefinition,
  outputType: string
): GeneratedFunctionMember[] => {
  const parserName = `parse${outputType}`;
  switch (type) {
    case 'header':
      return [renderHeaderTypeParserDeclaration(def, parserName)];
    case 'query':
      return [renderQueryTypeParserDeclaration(def, parserName)];
    case 'path':
      return [renderJsonTypeParserDeclaration(def, parserName, outputType)];
    default:
      return [];
  }
};
