import { AnyTypeDefinition } from './types/TypeDefinition';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';
import { GeneratedFunctionMember } from './types/GeneratedMember';

export const renderHeaderTypeParserDeclaration = (
  def: AnyTypeDefinition,
  name: string
): GeneratedFunctionMember => {
  if ('literal' in def) {
    const properties = def.literal.properties.map(
      ({ name, type, required }) => {
        const { definition, dependsOn } = renderJsonTypeParserExpression(type);
        const path = `'header.${name}'`;
        const wrappedFn = required ? `required(${definition})` : definition;
        const parseFn = `${wrappedFn}(input['${name}'], ${path})`;
        return {
          definition: `${name}: ${parseFn}`,
          dependsOn
        };
      }
    );

    const definition = `(input: IncomingHttpHeaders) => {
      return {${properties.map(p => p.definition).join(',\n')}};
    }`;

    return {
      type: 'function',
      name,
      declaration: `export const ${name} = ${definition};`,
      dependsOn: [
        ...def.dependencies,
        ...properties.flatMap(p => p.dependsOn),
        'required'
      ],
      imports: ["import { IncomingHttpHeaders } from 'http';"]
    };
  }
  throw new Error(`Unsupported type definition in header`);
};
