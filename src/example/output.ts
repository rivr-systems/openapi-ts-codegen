import { ParsedQs } from 'qs';

import { IncomingHttpHeaders } from 'http';

import { RequestHandler } from 'express';

import { Router } from 'express';

export type JsonPrimitive = string | number | boolean | null;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonArray extends Array<JsonPrimitive | JsonArray | JsonMap> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JsonMap
  extends Record<string, JsonPrimitive | JsonArray | JsonMap> {}

export type Json = JsonPrimitive | JsonMap | JsonArray;

export class ParseError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
  }
}

export type Parser<T> = (input: Json | undefined, path: string) => T;

export const createRequestUrl = <
  TQuery extends { [key: string]: string | null | undefined },
  TPath extends { [key: string]: string | null | undefined }
>({
  baseUrl,
  path,
  query,
  pathParams
}: {
  baseUrl: string;
  path: string;
  query?: TQuery;
  pathParams?: TPath;
}) => {
  const queryString = (() => {
    if (!query) return;
    return Object.keys(query)
      .map(key => `${key}=${query[key as keyof TQuery]}`)
      .join('&');
  })();

  const expandedPath = (() => {
    if (!pathParams) return path;
    let r = path;
    Object.keys(pathParams).forEach(key => {
      r = r.replace(`{${key}}`, pathParams[key as keyof TPath] ?? '');
    });
  })();

  return [`${baseUrl}/${expandedPath}`, queryString].join('&');
};

export const required = <T>(
  parser: Parser<T | null | undefined>
): Parser<T> => (input: Json | undefined, path: string) => {
  const maybe = parser(input, path);
  if (typeof maybe === 'undefined' || maybe === null) {
    throw new ParseError(path, 'required');
  }
  return maybe;
};

export const parseArray = <T>(parser: Parser<T | null | undefined>) => (
  input: Json | undefined,
  path: string
): Array<T> | null => {
  if (typeof input === 'undefined' || input === null) {
    return [];
  }
  if (typeof input !== 'object' || !Array.isArray(input)) {
    throw new ParseError(path, 'must be an array');
  }
  return input.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    const i = required(parser)(item, itemPath);
    return i;
  });
};

export const parseString: Parser<string | null | undefined> = (
  input: Json | undefined,
  path: string
) => {
  if (typeof input === 'undefined' || input === null) {
    return input;
  }
  if (typeof input !== 'string') {
    throw new ParseError(path, 'must be a string');
  }
  return input;
};

export const parseNumber: Parser<number | null | undefined> = (
  input: Json | undefined,
  path: string
) => {
  if (typeof input === 'undefined' || input === null) {
    return input;
  }
  if (typeof input !== 'number') {
    throw new ParseError(path, 'must be a number');
  }
  return input;
};

export const parseBoolean: Parser<boolean | null | undefined> = (
  input: Json | undefined,
  path: string
) => {
  if (typeof input === 'undefined' || input === null) {
    return input;
  }
  if (typeof input !== 'boolean') {
    throw new ParseError(path, 'must be a number');
  }
  return input;
};

export const parseEnum = <T extends string>(
  values: T[]
): Parser<T | null | undefined> => (input: Json | undefined, path: string) => {
  if (typeof input === 'undefined' || input === null) {
    return input;
  }
  if (typeof input !== 'string') {
    throw new ParseError(path, 'must be a string');
  }
  if (!values.includes(input as T)) {
    throw new ParseError(path, `must be one of ${values.join(', ')}`);
  }
  return input as T;
};

export const parseOneOf = <T>(
  operations: Parser<T | null | undefined>[]
): Parser<T | null | undefined> => {
  return (input: Json | undefined, path: string) => {
    let lastError: Error | null = null;
    for (let index = 0; index < operations.length; index++) {
      const element = operations[index];
      try {
        const candidate = element(input, path);
        if (typeof candidate !== 'undefined' && candidate !== null) {
          return candidate;
        }
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) {
      throw lastError;
    }
    return null;
  };
};

export const parseQueryString = (
  input: undefined | string | string[] | ParsedQs | ParsedQs[],
  path: string
) => {
  if (typeof input === 'undefined' || input === null) {
    return null;
  }
  if (typeof input !== 'string') {
    throw new ParseError(path, 'must be a string');
  }
  return input;
};

export type BadRequestResponsePayload = { errors: Array<string> };

export const parseBadRequestResponsePayload: Parser<
  BadRequestResponsePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    errors: required(parseArray(parseString))(input['errors'], path + '.errors')
  };
};

export type VenueThemePayload = {
  logoSrcSet?: string | null;
  tintColour?: string | null;
};

export type VenueResponsePayload = {
  id: string;
  title: string;
  serviceChargePercent?: string | null;
  theme?: VenueThemePayload | null;
};

export type VenuesResponsePayload = { venues: Array<VenueResponsePayload> };

export const parseVenueThemePayload: Parser<
  VenueThemePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    logoSrcSet: parseString(input['logoSrcSet'], path + '.logoSrcSet'),
    tintColour: parseString(input['tintColour'], path + '.tintColour')
  };
};

export const parseVenueResponsePayload: Parser<
  VenueResponsePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    id: required(parseString)(input['id'], path + '.id'),
    title: required(parseString)(input['title'], path + '.title'),
    serviceChargePercent: parseString(
      input['serviceChargePercent'],
      path + '.serviceChargePercent'
    ),
    theme: parseVenueThemePayload(input['theme'], path + '.theme')
  };
};

export const parseVenuesResponsePayload: Parser<
  VenuesResponsePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venues: required(parseArray(parseVenueResponsePayload))(
      input['venues'],
      path + '.venues'
    )
  };
};

export type VenuePostRequestPayload = {
  title: string;
  theme?: VenueThemePayload | null;
  serviceChargePercent?: string | null;
};

export const parseVenuePostRequestPayload: Parser<
  VenuePostRequestPayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    title: required(parseString)(input['title'], path + '.title'),
    theme: parseVenueThemePayload(input['theme'], path + '.theme'),
    serviceChargePercent: parseString(
      input['serviceChargePercent'],
      path + '.serviceChargePercent'
    )
  };
};

export type VenuePutRequestPayload = {
  id: string;
  title: string;
  theme?: VenueThemePayload | null;
  serviceChargePercent?: string | null;
};

export const parseVenuePutRequestPayload: Parser<
  VenuePutRequestPayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    id: required(parseString)(input['id'], path + '.id'),
    title: required(parseString)(input['title'], path + '.title'),
    theme: parseVenueThemePayload(input['theme'], path + '.theme'),
    serviceChargePercent: parseString(
      input['serviceChargePercent'],
      path + '.serviceChargePercent'
    )
  };
};

export type TableResponsePayload = { id: string; name: string };

export type TablesResponsePayload = { tables: Array<TableResponsePayload> };

export const parseTableResponsePayload: Parser<
  TableResponsePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    id: required(parseString)(input['id'], path + '.id'),
    name: required(parseString)(input['name'], path + '.name')
  };
};

export const parseTablesResponsePayload: Parser<
  TablesResponsePayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    tables: required(parseArray(parseTableResponsePayload))(
      input['tables'],
      path + '.tables'
    )
  };
};

export type TablePutRequestPayload = { id: string; name: string };

export const parseTablePutRequestPayload: Parser<
  TablePutRequestPayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    id: required(parseString)(input['id'], path + '.id'),
    name: required(parseString)(input['name'], path + '.name')
  };
};

export type TablePostRequestPayload = { name: string };

export const parseTablePostRequestPayload: Parser<
  TablePostRequestPayload | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return { name: required(parseString)(input['name'], path + '.name') };
};

export type GetVenuesHeaderParameters = { authorization: string };

export type GetVenuesQueryParameters = { name?: string | null };

export type GetVenuesParameters = GetVenuesHeaderParameters &
  GetVenuesQueryParameters;

export type GetVenues200ResponseBody =
  | VenuesResponsePayload
  | TablesResponsePayload;

export type GetVenues200Response = {
  status: 200;
  body: GetVenues200ResponseBody;
};

export type GetVenues400ResponseBody = BadRequestResponsePayload;

export type GetVenues400Response = {
  status: 400;
  body: GetVenues400ResponseBody;
};

export type GetVenues401ResponseBody = { type: 'INVALID_TOKEN' };

export type GetVenues401Response = {
  status: 401;
  body: GetVenues401ResponseBody;
};

export type GetVenuesResponse =
  | GetVenues200Response
  | GetVenues400Response
  | GetVenues401Response;

export type GetVenuesControllerHandler = (
  input: { params: GetVenuesParameters } | { error: ParseError }
) => Promise<GetVenuesResponse>;

export const parseGetVenuesHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parseGetVenuesQueryParameters = (input: ParsedQs) => {
  return {
    name: parseString(
      parseQueryString(input['name'], 'query.name'),
      'query.name'
    )
  };
};

export const GetVenuesController = (
  handler: GetVenuesControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parseGetVenuesHeaderParameters(req.headers),
          ...parseGetVenuesQueryParameters(req.query)
        };

        return { params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type PostVenueHeaderParameters = { authorization: string };

export type PostVenueParameters = PostVenueHeaderParameters;

export type PostVenue200ResponseBody = VenueResponsePayload;

export type PostVenue200Response = {
  status: 200;
  body: PostVenue200ResponseBody;
};

export type PostVenue400ResponseBody = BadRequestResponsePayload;

export type PostVenue400Response = {
  status: 400;
  body: PostVenue400ResponseBody;
};

export type PostVenue401ResponseBody = {
  type: 'INVALID_TOKEN' | 'ACCESS_DENIED';
};

export type PostVenue401Response = {
  status: 401;
  body: PostVenue401ResponseBody;
};

export type PostVenueResponse =
  | PostVenue200Response
  | PostVenue400Response
  | PostVenue401Response;

export type PostVenueControllerHandler = (
  input:
    | { params: PostVenueParameters; body: PostVenueBody }
    | { error: ParseError }
) => Promise<PostVenueResponse>;

export const parsePostVenueBody = required(
  parseOneOf<VenuePostRequestPayload | TablePostRequestPayload>([
    parseVenuePostRequestPayload,
    parseTablePostRequestPayload
  ])
);

export type PostVenueBody = VenuePostRequestPayload | TablePostRequestPayload;

export const parsePostVenueHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const PostVenueController = (
  handler: PostVenueControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parsePostVenueHeaderParameters(req.headers)
        };
        const body = parsePostVenueBody(req.body, 'body');
        return { body, params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type GetVenuePathParameters = { venueId: string };

export type GetVenueHeaderParameters = { authorization: string };

export type GetVenueParameters = GetVenuePathParameters &
  GetVenueHeaderParameters;

export type GetVenue200ResponseBody = VenueResponsePayload;

export type GetVenue200Response = {
  status: 200;
  body: GetVenue200ResponseBody;
};

export type GetVenue400ResponseBody = BadRequestResponsePayload;

export type GetVenue400Response = {
  status: 400;
  body: GetVenue400ResponseBody;
};

export type GetVenue401ResponseBody = { type: 'INVALID_TOKEN' };

export type GetVenue401Response = {
  status: 401;
  body: GetVenue401ResponseBody;
};

export type GetVenue404Response = { status: 404 };

export type GetVenueResponse =
  | GetVenue200Response
  | GetVenue400Response
  | GetVenue401Response
  | GetVenue404Response;

export type GetVenueControllerHandler = (
  input: { params: GetVenueParameters } | { error: ParseError }
) => Promise<GetVenueResponse>;

export const parseGetVenueHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parseGetVenuePathParameters: Parser<
  GetVenuePathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId')
  };
};

export const GetVenueController = (
  handler: GetVenueControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parseGetVenueHeaderParameters(req.headers),
          ...required(parseGetVenuePathParameters)(req.params, 'path')
        };

        return { params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type PutVenuePathParameters = { venueId: string };

export type PutVenueHeaderParameters = { authorization: string };

export type PutVenueParameters = PutVenuePathParameters &
  PutVenueHeaderParameters;

export type PutVenue200ResponseBody = VenueResponsePayload;

export type PutVenue200Response = {
  status: 200;
  body: PutVenue200ResponseBody;
};

export type PutVenue400ResponseBody = BadRequestResponsePayload;

export type PutVenue400Response = {
  status: 400;
  body: PutVenue400ResponseBody;
};

export type PutVenue401ResponseBody = {
  type: 'INVALID_TOKEN' | 'ACCESS_DENIED';
};

export type PutVenue401Response = {
  status: 401;
  body: PutVenue401ResponseBody;
};

export type PutVenue404Response = { status: 404 };

export type PutVenueResponse =
  | PutVenue200Response
  | PutVenue400Response
  | PutVenue401Response
  | PutVenue404Response;

export type PutVenueControllerHandler = (
  input:
    | { params: PutVenueParameters; body: PutVenueBody | null | undefined }
    | { error: ParseError }
) => Promise<PutVenueResponse>;

export const parsePutVenueBody = parseVenuePutRequestPayload;

export type PutVenueBody = VenuePutRequestPayload | null;

export const parsePutVenueHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parsePutVenuePathParameters: Parser<
  PutVenuePathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId')
  };
};

export const PutVenueController = (
  handler: PutVenueControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parsePutVenueHeaderParameters(req.headers),
          ...required(parsePutVenuePathParameters)(req.params, 'path')
        };
        const body = parsePutVenueBody(req.body, 'body');
        return { body, params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type GetTablesPathParameters = { venueId: string };

export type GetTablesHeaderParameters = { authorization: string };

export type GetTablesParameters = GetTablesPathParameters &
  GetTablesHeaderParameters;

export type GetTables200ResponseBody = TablesResponsePayload;

export type GetTables200Response = {
  status: 200;
  body: GetTables200ResponseBody;
};

export type GetTables400ResponseBody = BadRequestResponsePayload;

export type GetTables400Response = {
  status: 400;
  body: GetTables400ResponseBody;
};

export type GetTables401ResponseBody = { type: 'INVALID_TOKEN' };

export type GetTables401Response = {
  status: 401;
  body: GetTables401ResponseBody;
};

export type GetTablesResponse =
  | GetTables200Response
  | GetTables400Response
  | GetTables401Response;

export type GetTablesControllerHandler = (
  input: { params: GetTablesParameters } | { error: ParseError }
) => Promise<GetTablesResponse>;

export const parseGetTablesHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parseGetTablesPathParameters: Parser<
  GetTablesPathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId')
  };
};

export const GetTablesController = (
  handler: GetTablesControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parseGetTablesHeaderParameters(req.headers),
          ...required(parseGetTablesPathParameters)(req.params, 'path')
        };

        return { params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type PostTablePathParameters = { venueId: string };

export type PostTableHeaderParameters = { authorization: string };

export type PostTableParameters = PostTablePathParameters &
  PostTableHeaderParameters;

export type PostTable200ResponseBody = TableResponsePayload;

export type PostTable200Response = {
  status: 200;
  body: PostTable200ResponseBody;
};

export type PostTable400ResponseBody = BadRequestResponsePayload;

export type PostTable400Response = {
  status: 400;
  body: PostTable400ResponseBody;
};

export type PostTable401ResponseBody = {
  type: 'INVALID_TOKEN' | 'ACCESS_DENIED';
};

export type PostTable401Response = {
  status: 401;
  body: PostTable401ResponseBody;
};

export type PostTableResponse =
  | PostTable200Response
  | PostTable400Response
  | PostTable401Response;

export type PostTableControllerHandler = (
  input:
    | { params: PostTableParameters; body: PostTableBody | null | undefined }
    | { error: ParseError }
) => Promise<PostTableResponse>;

export const parsePostTableBody = parseTablePostRequestPayload;

export type PostTableBody = TablePostRequestPayload | null;

export const parsePostTableHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parsePostTablePathParameters: Parser<
  PostTablePathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId')
  };
};

export const PostTableController = (
  handler: PostTableControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parsePostTableHeaderParameters(req.headers),
          ...required(parsePostTablePathParameters)(req.params, 'path')
        };
        const body = parsePostTableBody(req.body, 'body');
        return { body, params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type GetTablePathParameters = { venueId: string; tableId: string };

export type GetTableHeaderParameters = { authorization: string };

export type GetTableParameters = GetTablePathParameters &
  GetTableHeaderParameters;

export type GetTable200ResponseBody = TableResponsePayload;

export type GetTable200Response = {
  status: 200;
  body: GetTable200ResponseBody;
};

export type GetTable400ResponseBody = BadRequestResponsePayload;

export type GetTable400Response = {
  status: 400;
  body: GetTable400ResponseBody;
};

export type GetTable401ResponseBody = { type: 'INVALID_TOKEN' };

export type GetTable401Response = {
  status: 401;
  body: GetTable401ResponseBody;
};

export type GetTable404Response = { status: 404 };

export type GetTableResponse =
  | GetTable200Response
  | GetTable400Response
  | GetTable401Response
  | GetTable404Response;

export type GetTableControllerHandler = (
  input: { params: GetTableParameters } | { error: ParseError }
) => Promise<GetTableResponse>;

export const parseGetTableHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parseGetTablePathParameters: Parser<
  GetTablePathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId'),
    tableId: required(parseString)(input['tableId'], path + '.tableId')
  };
};

export const GetTableController = (
  handler: GetTableControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parseGetTableHeaderParameters(req.headers),
          ...required(parseGetTablePathParameters)(req.params, 'path')
        };

        return { params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export type PutTablePathParameters = { venueId: string; tableId: string };

export type PutTableHeaderParameters = { authorization: string };

export type PutTableParameters = PutTablePathParameters &
  PutTableHeaderParameters;

export type PutTable200ResponseBody = TableResponsePayload;

export type PutTable200Response = {
  status: 200;
  body: PutTable200ResponseBody;
};

export type PutTable400ResponseBody = BadRequestResponsePayload;

export type PutTable400Response = {
  status: 400;
  body: PutTable400ResponseBody;
};

export type PutTable401ResponseBody = {
  type: 'INVALID_TOKEN' | 'ACCESS_DENIED';
};

export type PutTable401Response = {
  status: 401;
  body: PutTable401ResponseBody;
};

export type PutTable404Response = { status: 404 };

export type PutTableResponse =
  | PutTable200Response
  | PutTable400Response
  | PutTable401Response
  | PutTable404Response;

export type PutTableControllerHandler = (
  input:
    | { params: PutTableParameters; body: PutTableBody | null | undefined }
    | { error: ParseError }
) => Promise<PutTableResponse>;

export const parsePutTableBody = parseTablePutRequestPayload;

export type PutTableBody = TablePutRequestPayload | null;

export const parsePutTableHeaderParameters = (input: IncomingHttpHeaders) => {
  return {
    authorization: required(parseString)(
      input['authorization'],
      'header.authorization'
    )
  };
};

export const parsePutTablePathParameters: Parser<
  PutTablePathParameters | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    venueId: required(parseString)(input['venueId'], path + '.venueId'),
    tableId: required(parseString)(input['tableId'], path + '.tableId')
  };
};

export const PutTableController = (
  handler: PutTableControllerHandler
): RequestHandler => {
  return async (req, res, next) => {
    const getInput = () => {
      try {
        const params = {
          ...parsePutTableHeaderParameters(req.headers),
          ...required(parsePutTablePathParameters)(req.params, 'path')
        };
        const body = parsePutTableBody(req.body, 'body');
        return { body, params };
      } catch (error: unknown) {
        if (error instanceof ParseError) {
          return { error };
        }
        throw error;
      }
    };
    try {
      const response = await handler(getInput());
      res.status(response.status);
      if ('body' in response) {
        res.send(response.body);
      }
      res.end();
    } catch (error) {
      next(error);
    }
  };
};

export const createServer = (
  getVenues: GetVenuesControllerHandler,
  postVenue: PostVenueControllerHandler,
  getVenue: GetVenueControllerHandler,
  putVenue: PutVenueControllerHandler,
  getTables: GetTablesControllerHandler,
  postTable: PostTableControllerHandler,
  getTable: GetTableControllerHandler,
  putTable: PutTableControllerHandler
) => {
  return Router()
    .get('/venue', GetVenuesController(getVenues))
    .post('/venue', PostVenueController(postVenue))
    .get('/venue/:venueId', GetVenueController(getVenue))
    .put('/venue/:venueId', PutVenueController(putVenue))
    .get('/venue/:venueId/table', GetTablesController(getTables))
    .post('/venue/:venueId/table', PostTableController(postTable))
    .get('/venue/:venueId/table/:tableId', GetTableController(getTable))
    .put('/venue/:venueId/table/:tableId', PutTableController(putTable));
};

export const parseGetVenues200ResponseBody: Parser<
  GetVenues200ResponseBody | null | undefined
> = parseOneOf<VenuesResponsePayload | TablesResponsePayload>([
  parseVenuesResponsePayload,
  parseTablesResponsePayload
]);

export const parseGetVenues200Response = (body: Json): GetVenues200Response => {
  return {
    status: 200,
    body: required(parseGetVenues200ResponseBody)(body, 'body')
  };
};

export const parseGetVenues400ResponseBody: Parser<
  GetVenues400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parseGetVenues400Response = (body: Json): GetVenues400Response => {
  return {
    status: 400,
    body: required(parseGetVenues400ResponseBody)(body, 'body')
  };
};

export const parseGetVenues401ResponseBody: Parser<
  GetVenues401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN'>(['INVALID_TOKEN'])
    )(input['type'], path + '.type')
  };
};

export const parseGetVenues401Response = (body: Json): GetVenues401Response => {
  return {
    status: 401,
    body: required(parseGetVenues401ResponseBody)(body, 'body')
  };
};

export const getVenuesClient = (baseUrl: string) => async (
  headers: GetVenuesHeaderParameters,
  query: GetVenuesQueryParameters
): Promise<GetVenuesResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue',
    query
  });

  const response = await fetch(url, {
    method: 'get',
    headers
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parseGetVenues200Response(responseBody);
    case 400:
      return parseGetVenues400Response(responseBody);
    case 401:
      return parseGetVenues401Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parsePostVenue200ResponseBody: Parser<
  PostVenue200ResponseBody | null | undefined
> = parseVenueResponsePayload;

export const parsePostVenue200Response = (body: Json): PostVenue200Response => {
  return {
    status: 200,
    body: required(parsePostVenue200ResponseBody)(body, 'body')
  };
};

export const parsePostVenue400ResponseBody: Parser<
  PostVenue400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parsePostVenue400Response = (body: Json): PostVenue400Response => {
  return {
    status: 400,
    body: required(parsePostVenue400ResponseBody)(body, 'body')
  };
};

export const parsePostVenue401ResponseBody: Parser<
  PostVenue401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN' | 'ACCESS_DENIED'>([
        'INVALID_TOKEN',
        'ACCESS_DENIED'
      ])
    )(input['type'], path + '.type')
  };
};

export const parsePostVenue401Response = (body: Json): PostVenue401Response => {
  return {
    status: 401,
    body: required(parsePostVenue401ResponseBody)(body, 'body')
  };
};

export const postVenueClient = (baseUrl: string) => async (
  headers: PostVenueHeaderParameters,
  body: PostVenueBody
): Promise<PostVenueResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue'
  });

  const response = await fetch(url, {
    method: 'post',
    headers,
    body: JSON.stringify(body)
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parsePostVenue200Response(responseBody);
    case 400:
      return parsePostVenue400Response(responseBody);
    case 401:
      return parsePostVenue401Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parseGetVenue200ResponseBody: Parser<
  GetVenue200ResponseBody | null | undefined
> = parseVenueResponsePayload;

export const parseGetVenue200Response = (body: Json): GetVenue200Response => {
  return {
    status: 200,
    body: required(parseGetVenue200ResponseBody)(body, 'body')
  };
};

export const parseGetVenue400ResponseBody: Parser<
  GetVenue400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parseGetVenue400Response = (body: Json): GetVenue400Response => {
  return {
    status: 400,
    body: required(parseGetVenue400ResponseBody)(body, 'body')
  };
};

export const parseGetVenue401ResponseBody: Parser<
  GetVenue401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN'>(['INVALID_TOKEN'])
    )(input['type'], path + '.type')
  };
};

export const parseGetVenue401Response = (body: Json): GetVenue401Response => {
  return {
    status: 401,
    body: required(parseGetVenue401ResponseBody)(body, 'body')
  };
};

export const parseGetVenue404Response = (body: Json): GetVenue404Response => {
  return {
    status: 404
  };
};

export const getVenueClient = (baseUrl: string) => async (
  headers: GetVenueHeaderParameters,
  pathParams: GetVenuePathParameters
): Promise<GetVenueResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}',
    pathParams
  });

  const response = await fetch(url, {
    method: 'get',
    headers
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parseGetVenue200Response(responseBody);
    case 400:
      return parseGetVenue400Response(responseBody);
    case 401:
      return parseGetVenue401Response(responseBody);
    case 404:
      return parseGetVenue404Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parsePutVenue200ResponseBody: Parser<
  PutVenue200ResponseBody | null | undefined
> = parseVenueResponsePayload;

export const parsePutVenue200Response = (body: Json): PutVenue200Response => {
  return {
    status: 200,
    body: required(parsePutVenue200ResponseBody)(body, 'body')
  };
};

export const parsePutVenue400ResponseBody: Parser<
  PutVenue400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parsePutVenue400Response = (body: Json): PutVenue400Response => {
  return {
    status: 400,
    body: required(parsePutVenue400ResponseBody)(body, 'body')
  };
};

export const parsePutVenue401ResponseBody: Parser<
  PutVenue401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN' | 'ACCESS_DENIED'>([
        'INVALID_TOKEN',
        'ACCESS_DENIED'
      ])
    )(input['type'], path + '.type')
  };
};

export const parsePutVenue401Response = (body: Json): PutVenue401Response => {
  return {
    status: 401,
    body: required(parsePutVenue401ResponseBody)(body, 'body')
  };
};

export const parsePutVenue404Response = (body: Json): PutVenue404Response => {
  return {
    status: 404
  };
};

export const putVenueClient = (baseUrl: string) => async (
  headers: PutVenueHeaderParameters,
  pathParams: PutVenuePathParameters,
  body: PutVenueBody
): Promise<PutVenueResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}',
    pathParams
  });

  const response = await fetch(url, {
    method: 'put',
    headers,
    body: JSON.stringify(body)
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parsePutVenue200Response(responseBody);
    case 400:
      return parsePutVenue400Response(responseBody);
    case 401:
      return parsePutVenue401Response(responseBody);
    case 404:
      return parsePutVenue404Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parseGetTables200ResponseBody: Parser<
  GetTables200ResponseBody | null | undefined
> = parseTablesResponsePayload;

export const parseGetTables200Response = (body: Json): GetTables200Response => {
  return {
    status: 200,
    body: required(parseGetTables200ResponseBody)(body, 'body')
  };
};

export const parseGetTables400ResponseBody: Parser<
  GetTables400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parseGetTables400Response = (body: Json): GetTables400Response => {
  return {
    status: 400,
    body: required(parseGetTables400ResponseBody)(body, 'body')
  };
};

export const parseGetTables401ResponseBody: Parser<
  GetTables401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN'>(['INVALID_TOKEN'])
    )(input['type'], path + '.type')
  };
};

export const parseGetTables401Response = (body: Json): GetTables401Response => {
  return {
    status: 401,
    body: required(parseGetTables401ResponseBody)(body, 'body')
  };
};

export const getTablesClient = (baseUrl: string) => async (
  headers: GetTablesHeaderParameters,
  pathParams: GetTablesPathParameters
): Promise<GetTablesResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}/table',
    pathParams
  });

  const response = await fetch(url, {
    method: 'get',
    headers
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parseGetTables200Response(responseBody);
    case 400:
      return parseGetTables400Response(responseBody);
    case 401:
      return parseGetTables401Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parsePostTable200ResponseBody: Parser<
  PostTable200ResponseBody | null | undefined
> = parseTableResponsePayload;

export const parsePostTable200Response = (body: Json): PostTable200Response => {
  return {
    status: 200,
    body: required(parsePostTable200ResponseBody)(body, 'body')
  };
};

export const parsePostTable400ResponseBody: Parser<
  PostTable400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parsePostTable400Response = (body: Json): PostTable400Response => {
  return {
    status: 400,
    body: required(parsePostTable400ResponseBody)(body, 'body')
  };
};

export const parsePostTable401ResponseBody: Parser<
  PostTable401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN' | 'ACCESS_DENIED'>([
        'INVALID_TOKEN',
        'ACCESS_DENIED'
      ])
    )(input['type'], path + '.type')
  };
};

export const parsePostTable401Response = (body: Json): PostTable401Response => {
  return {
    status: 401,
    body: required(parsePostTable401ResponseBody)(body, 'body')
  };
};

export const postTableClient = (baseUrl: string) => async (
  headers: PostTableHeaderParameters,
  pathParams: PostTablePathParameters,
  body: PostTableBody
): Promise<PostTableResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}/table',
    pathParams
  });

  const response = await fetch(url, {
    method: 'post',
    headers,
    body: JSON.stringify(body)
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parsePostTable200Response(responseBody);
    case 400:
      return parsePostTable400Response(responseBody);
    case 401:
      return parsePostTable401Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parseGetTable200ResponseBody: Parser<
  GetTable200ResponseBody | null | undefined
> = parseTableResponsePayload;

export const parseGetTable200Response = (body: Json): GetTable200Response => {
  return {
    status: 200,
    body: required(parseGetTable200ResponseBody)(body, 'body')
  };
};

export const parseGetTable400ResponseBody: Parser<
  GetTable400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parseGetTable400Response = (body: Json): GetTable400Response => {
  return {
    status: 400,
    body: required(parseGetTable400ResponseBody)(body, 'body')
  };
};

export const parseGetTable401ResponseBody: Parser<
  GetTable401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN'>(['INVALID_TOKEN'])
    )(input['type'], path + '.type')
  };
};

export const parseGetTable401Response = (body: Json): GetTable401Response => {
  return {
    status: 401,
    body: required(parseGetTable401ResponseBody)(body, 'body')
  };
};

export const parseGetTable404Response = (body: Json): GetTable404Response => {
  return {
    status: 404
  };
};

export const getTableClient = (baseUrl: string) => async (
  headers: GetTableHeaderParameters,
  pathParams: GetTablePathParameters
): Promise<GetTableResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}/table/{tableId}',
    pathParams
  });

  const response = await fetch(url, {
    method: 'get',
    headers
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parseGetTable200Response(responseBody);
    case 400:
      return parseGetTable400Response(responseBody);
    case 401:
      return parseGetTable401Response(responseBody);
    case 404:
      return parseGetTable404Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const parsePutTable200ResponseBody: Parser<
  PutTable200ResponseBody | null | undefined
> = parseTableResponsePayload;

export const parsePutTable200Response = (body: Json): PutTable200Response => {
  return {
    status: 200,
    body: required(parsePutTable200ResponseBody)(body, 'body')
  };
};

export const parsePutTable400ResponseBody: Parser<
  PutTable400ResponseBody | null | undefined
> = parseBadRequestResponsePayload;

export const parsePutTable400Response = (body: Json): PutTable400Response => {
  return {
    status: 400,
    body: required(parsePutTable400ResponseBody)(body, 'body')
  };
};

export const parsePutTable401ResponseBody: Parser<
  PutTable401ResponseBody | null | undefined
> = (input: Json | undefined, path: string) => {
  if (input === null || typeof input === 'undefined') {
    return input;
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ParseError(path, 'must be an object');
  }
  return {
    type: required(
      parseEnum<'INVALID_TOKEN' | 'ACCESS_DENIED'>([
        'INVALID_TOKEN',
        'ACCESS_DENIED'
      ])
    )(input['type'], path + '.type')
  };
};

export const parsePutTable401Response = (body: Json): PutTable401Response => {
  return {
    status: 401,
    body: required(parsePutTable401ResponseBody)(body, 'body')
  };
};

export const parsePutTable404Response = (body: Json): PutTable404Response => {
  return {
    status: 404
  };
};

export const putTableClient = (baseUrl: string) => async (
  headers: PutTableHeaderParameters,
  pathParams: PutTablePathParameters,
  body: PutTableBody
): Promise<PutTableResponse> => {
  const url = createRequestUrl({
    baseUrl,
    path: '/venue/{venueId}/table/{tableId}',
    pathParams
  });

  const response = await fetch(url, {
    method: 'put',
    headers,
    body: JSON.stringify(body)
  });

  const { status } = response;
  const responseBody = await response.json();

  switch (status) {
    case 200:
      return parsePutTable200Response(responseBody);
    case 400:
      return parsePutTable400Response(responseBody);
    case 401:
      return parsePutTable401Response(responseBody);
    case 404:
      return parsePutTable404Response(responseBody);
    default:
      throw new Error(`Received unexpected ${status} response.`);
  }
};

export const createClient = (baseUrl: string) => ({
  getVenues: getVenuesClient(baseUrl),
  postVenue: postVenueClient(baseUrl),
  getVenue: getVenueClient(baseUrl),
  putVenue: putVenueClient(baseUrl),
  getTables: getTablesClient(baseUrl),
  postTable: postTableClient(baseUrl),
  getTable: getTableClient(baseUrl),
  putTable: putTableClient(baseUrl)
});

export const createMockServer = () => {
  let getVenuesCalls: Parameters<GetVenuesControllerHandler>[0][] = [];
  let getVenuesResponse: ReturnType<GetVenuesControllerHandler> | undefined;
  let postVenueCalls: Parameters<PostVenueControllerHandler>[0][] = [];
  let postVenueResponse: ReturnType<PostVenueControllerHandler> | undefined;
  let getVenueCalls: Parameters<GetVenueControllerHandler>[0][] = [];
  let getVenueResponse: ReturnType<GetVenueControllerHandler> | undefined;
  let putVenueCalls: Parameters<PutVenueControllerHandler>[0][] = [];
  let putVenueResponse: ReturnType<PutVenueControllerHandler> | undefined;
  let getTablesCalls: Parameters<GetTablesControllerHandler>[0][] = [];
  let getTablesResponse: ReturnType<GetTablesControllerHandler> | undefined;
  let postTableCalls: Parameters<PostTableControllerHandler>[0][] = [];
  let postTableResponse: ReturnType<PostTableControllerHandler> | undefined;
  let getTableCalls: Parameters<GetTableControllerHandler>[0][] = [];
  let getTableResponse: ReturnType<GetTableControllerHandler> | undefined;
  let putTableCalls: Parameters<PutTableControllerHandler>[0][] = [];
  let putTableResponse: ReturnType<PutTableControllerHandler> | undefined;
  return {
    router: createServer(
      p => {
        getVenuesCalls.push(p);
        if (!getVenuesResponse) {
          throw new Error('Unexpected getVenues call');
        }
        return getVenuesResponse;
      },
      p => {
        postVenueCalls.push(p);
        if (!postVenueResponse) {
          throw new Error('Unexpected postVenue call');
        }
        return postVenueResponse;
      },
      p => {
        getVenueCalls.push(p);
        if (!getVenueResponse) {
          throw new Error('Unexpected getVenue call');
        }
        return getVenueResponse;
      },
      p => {
        putVenueCalls.push(p);
        if (!putVenueResponse) {
          throw new Error('Unexpected putVenue call');
        }
        return putVenueResponse;
      },
      p => {
        getTablesCalls.push(p);
        if (!getTablesResponse) {
          throw new Error('Unexpected getTables call');
        }
        return getTablesResponse;
      },
      p => {
        postTableCalls.push(p);
        if (!postTableResponse) {
          throw new Error('Unexpected postTable call');
        }
        return postTableResponse;
      },
      p => {
        getTableCalls.push(p);
        if (!getTableResponse) {
          throw new Error('Unexpected getTable call');
        }
        return getTableResponse;
      },
      p => {
        putTableCalls.push(p);
        if (!putTableResponse) {
          throw new Error('Unexpected putTable call');
        }
        return putTableResponse;
      }
    ),
    getVenuesCalls: () => getVenuesCalls,
    setGetVenuesResponse(r: ReturnType<GetVenuesControllerHandler>) {
      getVenuesResponse = r;
    },
    postVenueCalls: () => postVenueCalls,
    setPostVenueResponse(r: ReturnType<PostVenueControllerHandler>) {
      postVenueResponse = r;
    },
    getVenueCalls: () => getVenueCalls,
    setGetVenueResponse(r: ReturnType<GetVenueControllerHandler>) {
      getVenueResponse = r;
    },
    putVenueCalls: () => putVenueCalls,
    setPutVenueResponse(r: ReturnType<PutVenueControllerHandler>) {
      putVenueResponse = r;
    },
    getTablesCalls: () => getTablesCalls,
    setGetTablesResponse(r: ReturnType<GetTablesControllerHandler>) {
      getTablesResponse = r;
    },
    postTableCalls: () => postTableCalls,
    setPostTableResponse(r: ReturnType<PostTableControllerHandler>) {
      postTableResponse = r;
    },
    getTableCalls: () => getTableCalls,
    setGetTableResponse(r: ReturnType<GetTableControllerHandler>) {
      getTableResponse = r;
    },
    putTableCalls: () => putTableCalls,
    setPutTableResponse(r: ReturnType<PutTableControllerHandler>) {
      putTableResponse = r;
    },
    reset() {
      getVenuesCalls = [];
      getVenuesResponse = undefined;
      postVenueCalls = [];
      postVenueResponse = undefined;
      getVenueCalls = [];
      getVenueResponse = undefined;
      putVenueCalls = [];
      putVenueResponse = undefined;
      getTablesCalls = [];
      getTablesResponse = undefined;
      postTableCalls = [];
      postTableResponse = undefined;
      getTableCalls = [];
      getTableResponse = undefined;
      putTableCalls = [];
      putTableResponse = undefined;
      getVenuesCalls = [];
      getVenuesResponse = undefined;
    }
  };
};
