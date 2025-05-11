import { connectionSchema } from '../schemas/connection.js';
import { curry } from '../utils/curry.js';
import type {
  ApiRequestHandler,
  RequestResponseMap,
  Request,
} from '../utils/types.js';

export type ServerRouter = (request: Request) => () => void;

type Routes<T extends keyof RequestResponseMap> = Record<
  T,
  ApiRequestHandler<T>
>;

export function createRouter() {
  type Keys = keyof RequestResponseMap;
  const routes: Partial<Routes<Keys>> = {};
  const s = {
    add<T extends keyof RequestResponseMap>(path: T, fn: ApiRequestHandler<T>) {
      routes[path] = fn as unknown as (typeof routes)[T];
      return s;
    },
    all() {
      return routes;
    },
    validateAndDispach(request: Buffer<ArrayBufferLike>) {
      // verifica se os dados estão no formato esperado
      const data = connectionSchema.safeParse(JSON.parse(request.toString()));
      if (!data.success) {
        return {
          message: 'erro',
          success: false,
          error: data.error,
        };
      }
      return s.all()[data.data.type]?.(data.data.data);
    },
  };
  return s;
}

export const serverRouter = curry(
  (routes: Routes<keyof RequestResponseMap>, request: Request) => {
    return routes[request.type];
  },
);
