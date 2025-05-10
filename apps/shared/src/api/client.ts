import type { RequestResponseMap } from '../utils/main.types.js';
import { tcpRequest } from '../tcp/tcp.js';
import { SERVER_HOST, SERVER_PORT } from '../utils/constants.js';

const callRemoteMethod =
  (host: string, port: number) =>
  async <T extends keyof RequestResponseMap>(data: {
    type: T;
    data: RequestResponseMap[T]['input'];
  }) => {
    const res = await tcpRequest<RequestResponseMap[T]['output']>(
      data,
      host,
      port,
    );
    return res;
  };

export const apiClient = callRemoteMethod(SERVER_HOST, SERVER_PORT);
