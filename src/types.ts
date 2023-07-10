import { HTTP_METHODS } from "./constants.ts";
import { getJson, getText } from "./internals.ts";

/**
 * This is a generic schema type.
 * It represents an object with a `parse` function
 * that converts an unknown value to a value of type `T`.
 */
type Schema<T> = { parse: (d: unknown) => T };

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

type SearchParams = ConstructorParameters<typeof URLSearchParams>[0];

type TypedResponse = Omit<Response, "json" | "text"> & {
  json: TypedResponseJson;
  text: TypedResponseText;
};

type PathParams<T> = T extends string
  ? ExtractPathParams<T> extends Record<string, unknown>
    ? ExtractPathParams<T>
    : Record<string, string>
  : Record<string, string>;

type EnhancedRequestInit<T = string> = Omit<RequestInit, "body" | "method"> & {
  method?: HTTPMethod | Lowercase<HTTPMethod>;
  body?: JSONValue | BodyInit | null;
  query?: SearchParams;
  params?: PathParams<T>;
  trace?: (...args: Parameters<typeof fetch>) => void;
};

type ServiceRequestInit<T = string> = Omit<EnhancedRequestInit<T>, "method">;

type HTTPMethod = (typeof HTTP_METHODS)[number];

type TypedResponseJson = ReturnType<typeof getJson>;
type TypedResponseText = ReturnType<typeof getText>;

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type ExtractPathParams<T extends string> =
  T extends `${infer _}:${infer Param}/${infer Rest}`
    ? Prettify<Omit<{ [K in Param]: string } & ExtractPathParams<Rest>, "">>
    : T extends `${infer _}:${infer Param}`
    ? { [K in Param]: string }
    : {};

export type {
  EnhancedRequestInit,
  HTTPMethod,
  JSONValue,
  PathParams,
  Schema,
  SearchParams,
  ServiceRequestInit,
  TypedResponse,
  TypedResponseJson,
  TypedResponseText,
};
