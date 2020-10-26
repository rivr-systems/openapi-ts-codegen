import { EnumTypeDefinition } from './types/TypeDefinition';
import { GeneratedExpressionMember } from './types/GeneratedMember';

export const renderEnumTypeJsonParser = (
  def: EnumTypeDefinition
): GeneratedExpressionMember => {
  const members = def.enum.map(v => `'${v}'`);
  const definition = `parseEnum<${members.join('|')}>([${members.join(',')}])`;
  return {
    type: 'expression',
    definition,
    dependsOn: ['parseEnum']
  };
};
