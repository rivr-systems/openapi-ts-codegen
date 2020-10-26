import { AnyTypeDefinition } from './types/TypeDefinition';
import { renderJsonTypeParserExpression } from './renderJsonTypeParserExpression';
import { GeneratedFunctionMember } from './types/GeneratedMember';

export const renderQueryTypeParserDeclaration = (
  def: AnyTypeDefinition,
  name: string
): GeneratedFunctionMember => {
  if ('literal' in def) {
    const properties = def.literal.properties.map(
      ({ name, type, required }) => {
        const { definition, dependsOn } = renderJsonTypeParserExpression(type);
        const path = `'query.${name}'`;
        const wrappedFn = required ? `required(${definition})` : definition;
        const parseFn = `${wrappedFn}(parseQueryString(input['${name}'], ${path}), ${path})`;
        return {
          definition: `${name}: ${parseFn}`,
          dependsOn
        };
      }
    );

    const definition = `(input: ParsedQs) => {
      return {${properties.map(p => p.definition).join(',\n')}};
    }`;

    return {
      type: 'function',
      name,
      declaration: `export const ${name} = ${definition};`,
      dependsOn: [
        ...def.dependencies,
        ...properties.flatMap(p => p.dependsOn),
        'parseQueryString',
        'required'
      ],
      imports: ["import { ParsedQs } from 'qs'"]
    };
  }
  throw new Error(`Unsupported type definition in header`);
};
