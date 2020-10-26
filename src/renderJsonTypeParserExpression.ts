import {
  AnyTypeDefinition,
  defaultTypeDefinition
} from './types/TypeDefinition';
import { renderArrayTypeJsonParser } from './renderArrayTypeJsonParser';
import { renderBuiltInTypeJsonParser } from './renderBuiltInTypeJsonParser';
import { renderCompositeTypeJsonParser } from './renderCompositeTypeJsonParser';
import { renderEnumTypeJsonParser } from './renderEnumTypeJsonParser';
import { renderLiteralTypeJsonParser } from './renderLiteralTypeJsonParser';
import { renderReferenceTypeJsonParser } from './renderReferenceTypeJsonParser';
import { GeneratedExpressionMember } from './types/GeneratedMember';

export const renderJsonTypeParserExpression = (
  def: AnyTypeDefinition
): GeneratedExpressionMember => {
  if ('reference' in def) {
    return renderReferenceTypeJsonParser(def);
  }
  if ('builtIn' in def) {
    return renderBuiltInTypeJsonParser(def);
  }
  if ('literal' in def) {
    return renderLiteralTypeJsonParser(def);
  }
  if ('array' in def) {
    return renderArrayTypeJsonParser(def);
  }
  if ('enum' in def) {
    return renderEnumTypeJsonParser(def);
  }
  if ('members' in def) {
    return renderCompositeTypeJsonParser(def);
  }

  return renderJsonTypeParserExpression(defaultTypeDefinition);
};
