import { renderArrayTypeArgument } from './renderArrayTypeArgument';
import { renderBuiltInTypeArgument } from './renderBuiltInTypeArgument';
import { renderCompositeTypeArgument } from './renderCompositeTypeArgument';
import { renderEnumTypeArgument } from './renderEnumTypeArgument';
import { renderLiteralTypeArgument } from './renderLiteralTypeArgument';
import { renderReferenceTypeArgument } from './renderReferenceTypeArgument';
import { GeneratedTypeArgumentMember } from './types/GeneratedMember';
import { AnyTypeDefinition } from './types/TypeDefinition';

export const renderTypeArgument = (
  def: AnyTypeDefinition
): GeneratedTypeArgumentMember => {
  if ('reference' in def) {
    return renderReferenceTypeArgument(def);
  }
  if ('builtIn' in def) {
    return renderBuiltInTypeArgument(def);
  }
  if ('literal' in def) {
    return renderLiteralTypeArgument(def);
  }
  if ('array' in def) {
    return renderArrayTypeArgument(def);
  }
  if ('enum' in def) {
    return renderEnumTypeArgument(def);
  }
  if ('members' in def) {
    return renderCompositeTypeArgument(def);
  }

  return {
    type: 'typeArgument',
    definition: 'unknown',
    dependsOn: []
  };
};
