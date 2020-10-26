import { AnyGeneratedMember } from './types/GeneratedMember';
import { OperationObject, ParameterObject, Document } from './types/OpenAPIV3';
import { dereferenceParameter } from './dereferenceParameter';
import { renderParametersByType } from './renderParametersByType';

export const renderParameters = (
  params: OperationObject['parameters'],
  operationTypeName: string,
  doc: Document
): AnyGeneratedMember[] => {
  const stuff =
    params
      ?.map(p => {
        if ('$ref' in p) {
          return dereferenceParameter(p, doc);
        }
        return p;
      })
      .groupBy(p => p.in)
      .toArray()
      .map(p =>
        renderParametersByType(
          p.key as ParameterObject['in'],
          p.value,
          operationTypeName
        )
      )
      .flatMap(f => f) ?? [];
  const unionName = `${operationTypeName}Parameters`;
  const unionMembers = stuff
    .filter(m => m.type === 'type')
    .compactMap(m => ('name' in m ? m.name : null));
  const union = {
    type: 'type',
    name: unionName,
    declaration: `export type ${unionName} = ${unionMembers.join('&')}`,
    dependsOn: unionMembers
  } as AnyGeneratedMember;
  return [...stuff, union];
};
