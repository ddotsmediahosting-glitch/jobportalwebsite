/**
 * Override @types/express v5 types to match the actual Express v4 runtime.
 * In v5 types, ParamsDictionary changed to string | string[], but the runtime
 * is Express v4 where route params and query values are always strings.
 */
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
