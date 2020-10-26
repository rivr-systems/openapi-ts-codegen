import { dereferenceParameter } from './dereferenceParameter';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { OperationObject, Document } from './types/OpenAPIV3';

export const renderOperationClient = (
  method: string,
  doc: Document,
  operation: OperationObject,
  operationName: string,
  operationId: string,
  path: string
): AnyGeneratedMember[] => {
  const { requestBody } = operation;
  if (requestBody && '$ref' in requestBody) {
    throw new Error('Ref in request body not supported (yet)!');
  }
  const name = `${operationId}Client`;
  const responseName = `${operationName}Response`;
  const paramTypes =
    operation.parameters
      ?.map(p => {
        if ('$ref' in p) {
          return dereferenceParameter(p, doc);
        }
        return p;
      })
      .map(p => p.in)
      .distinct() ?? [];

  const hasHeaders = paramTypes.includes('header');
  const hasPath = paramTypes.includes('path');
  const hasQuery = paramTypes.includes('query');
  const hasBody = !!operation.requestBody;
  const statusCodes = operation.responses
    ? Object.keys(operation.responses)
    : [];

  return [
    {
      type: 'function',
      name,
      declaration:
        `export const ${name} = (baseUrl: string) => async (
        ${[
          ...(hasHeaders ? [`headers: ${operationName}HeaderParameters`] : []),
          ...(hasPath ? [`pathParams: ${operationName}PathParameters`] : []),
          ...(hasQuery ? [`query: ${operationName}QueryParameters`] : []),
          ...(hasBody ? [`body: ${operationName}Body`] : [])
        ].join(',\n')}
      ): Promise<${responseName}> => {
        const url = createRequestUrl({
          baseUrl,
          path: '${path}',
          ${[
            ...(hasPath ? [`pathParams`] : []),
            ...(hasQuery ? [`query`] : [])
          ].join(',\n')}
        });

        const response = await fetch(url, {
          ${[
            `method: '${method}'`,
            ...(hasHeaders ? ['headers'] : []),
            ...(hasBody ? ['body: JSON.stringify(body)'] : [])
          ].join(',\n')}
        });

        const { status } = response;
        const responseBody = await response.json();

        switch (status) {
          ${statusCodes
            .map(
              statusCode => `case ${statusCode}:
            return parse${operationName}${statusCode}Response(responseBody);`
            )
            .join('\n')}
          default:
            throw new Error(` +
        '`Received unexpected ${status} response.`' +
        `)
        }
      }`,
      dependsOn: [
        'createRequestUrl',
        responseName,
        ...(hasHeaders ? [`${operationName}HeaderParameters`] : []),
        ...(hasPath ? [`${operationName}PathParameters`] : []),
        ...(hasQuery ? [`${operationName}QueryParameters`] : []),
        ...(hasBody ? [`${operationName}Body`] : []),
        ...statusCodes.map(
          statusCode => `parse${operationName}${statusCode}Response`
        ),
        'required'
      ]
    }
  ];
};
