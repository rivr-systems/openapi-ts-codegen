import { Document } from './types/OpenAPIV3';
import { renderOperation } from './renderOperation';
import { AnyGeneratedMember } from './types/GeneratedMember';
import { renderOperationClient } from './renderOperationClient';

export const renderOperations = (doc: Document): AnyGeneratedMember[] => {
  const operations = Object.keys(doc.paths).flatMap(pathKey => {
    const path = doc.paths[pathKey];
    return [
      { method: 'get', operation: path.get },
      { method: 'put', operation: path.put },
      { method: 'post', operation: path.post },
      { method: 'delete', operation: path.delete },
      { method: 'options', operation: path.options },
      { method: 'head', operation: path.head },
      { method: 'patch', operation: path.patch },
      { method: 'trace', operation: path.trace }
    ]
      .compactMap(m => {
        const { method, operation } = m;
        if (operation) {
          return {
            path,
            pathKey,
            method,
            operation
          };
        }
      })
      .flatMap(m => m);
  });

  const handlers = operations.compactMap(o => {
    const { operation, method, pathKey } = o;
    const { operationId } = operation;
    if (!operationId) return;
    const operationName = operationId[0].toUpperCase() + operationId.slice(1);
    const controllerName = `${operationName}Controller`;
    const handlerName = `${controllerName}Handler`;
    return {
      controllerPath: pathKey.replace(
        /\{(?:.*?)\}/g,
        x => `:${x.substr(1, x.length - 2)}`
      ),
      pathKey,
      method,
      operationId,
      operation,
      handlerName,
      controllerName,
      operationName
    };
  });

  return [
    {
      type: 'function',
      name: 'createServer',
      declaration: `export const createServer = (
        ${handlers.map(h => `${h.operationId}: ${h.handlerName}`).join(',')}
      ) => {
        return Router()
        ${handlers
          .map(
            ({ method, controllerPath: path, controllerName, operationId }) =>
              `.${method}('${path}', ${controllerName}(${operationId}))`
          )
          .join('\n')};
      }`,
      dependsOn: handlers.flatMap(h => [h.controllerName, h.handlerName]),
      imports: ["import { Router } from 'express';"]
    },
    ...handlers.flatMap(({ operation, method, pathKey, operationName }) =>
      renderOperation(method, operation, operationName, doc, pathKey)
    ),
    {
      type: 'function',
      name: 'createClient',
      declaration: `export const createClient = (baseUrl: string) => ({
        ${handlers
          .map(h => `${h.operationId}: ${h.operationId}Client(baseUrl)`)
          .join(',\n')}
      })`,
      dependsOn: handlers.map(h => `${h.operationId}Client`)
    },
    {
      type: 'function',
      name: 'createMockServer',
      declaration: `export const createMockServer = () => {
        ${handlers
          .map(
            h => `let ${h.operationId}Calls: Parameters<${h.operationName}ControllerHandler>[0][] = [];
          let ${h.operationId}Response: ReturnType<${h.operationName}ControllerHandler> | undefined;`
          )
          .join('\n')}
        return {
          router: createServer(
            ${handlers
              .map(
                h => `(p) => {
              ${h.operationId}Calls.push(p);
              if (!${h.operationId}Response) {
                throw new Error('Unexpected ${h.operationId} call');
              }
              return ${h.operationId}Response;
            }`
              )
              .join(',\n')}
          ),
          ${handlers
            .map(
              h => `${h.operationId}Calls: () => ${h.operationId}Calls,
            set${h.operationName}Response(r: ReturnType<${h.operationName}ControllerHandler>) {
              ${h.operationId}Response = r;
            }`
            )
            .join(',\n')},
          reset() {
            ${handlers
              .map(
                h => `${h.operationId}Calls = [];
              ${h.operationId}Response = undefined;`
              )
              .join('\n')}
            getVenuesCalls = [];
            getVenuesResponse = undefined;
          }
        };
      };
      `,
      dependsOn: [
        ...handlers.map(h => `${h.operationName}ControllerHandler`),
        'createServer'
      ]
    }
  ];
};
