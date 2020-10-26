import { GeneratedFunctionMember } from './types/GeneratedMember';

export const renderCreateRequestUrl = (): GeneratedFunctionMember[] => {
  return [
    {
      type: 'function',
      name: 'createRequestUrl',
      declaration:
        `export const createRequestUrl = <
      TQuery extends { [key: string]: string | null | undefined },
      TPath extends { [key: string]: string | null | undefined }
    >({
      baseUrl, path, query, pathParams
    }: {
      baseUrl: string,
      path: string,
      query?: TQuery,
      pathParams?: TPath
    }) => {
      const queryString = (() => {
        if (!query) return;
        return Object.keys(query)
          .map(key => ` +
        '`${key}=${query[key as keyof TQuery]}`' +
        `)
          .join('&');
      })();
    
      const expandedPath = (() => {
        if (!pathParams) return path;
        let r = path;
        Object.keys(pathParams).forEach(key => {
          r = r.replace(` +
        '`{${key}}`' +
        `, pathParams[key as keyof TPath] ?? '');
        });
      })();
    
      return [` +
        '`${baseUrl}/${expandedPath}`' +
        `, queryString].join('&');
    };`,
      dependsOn: []
    }
  ];
};
