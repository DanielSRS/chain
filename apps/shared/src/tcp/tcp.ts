import * as net from 'node:net';
import { Logger } from '../utils/utils.js';

/**
 * Tipo de resposta da requisição TCPxw
 */
export type TCPResponse<T> =
  | {
      /**
       * Connexão tcp feita com sucesso
       */
      type: 'success';
      /**
       *  Dados recebidos na conclusão da conexão
       */
      data: T;
    }
  | {
      /**
       * Houve falha na conexão tcp
       */
      type: 'error';
      /**
       * Mensagem de erro
       */
      message: string;
      /**
       * Erro lançado
       */
      error: unknown;
    };

const log = Logger.extend('tcpRequest');

/**
 * Realiza uma requisição TCP para o servidor
 * @param data Dados a serem enviados
 * @param host Endereço do servidor
 * @param port Porta do servidor
 * @returns Uma Promise com o resultado da requisição
 */
export const tcpRequest = <T = unknown>(
  data: object,
  host: string,
  port: number,
) => {
  return new Promise<TCPResponse<T>>(resolve => {
    /**
     * Indica se a conexão foi concluída com sucesso ou por conta de um erro
     * Isso é importante para evitar que a Promise seja resolvida mais de uma vez
     * caso o servidor feche a conexão antes de receber os dados
     * ou se houver algum erro na conexão.
     * true significa que a conexão foi concluída com sucesso.
     */
    let done = false;

    /**
     * Cria um socket TCP e conecta ao servidor
     */
    const client = new net.Socket();
    client.connect(port, host, () => {
      /**
       * Envia os dados para o servidor quando a conexão é estabelecida
       */
      client.write(JSON.stringify(data));
    });

    /**
     * Recebe os dados de resposta para concluir a conexão
     */
    client.on('data', data => {
      /**
       * Verifica se os dados recebidos são válidos
       */
      if (typeof data === 'object' && data !== null) {
        /**
         * Resolve a Promise com os dados recebidos
         */
        resolve({
          type: 'success',
          data: JSON.parse(data.toString()),
        });
      } else {
        /**
         * Resolve a Promise com erro caso os dados não sejam válidos
         * Isso pode acontecer se o servidor não retornar um JSON válido
         * ou se houver algum erro na conexão
         */
        resolve({
          type: 'error',
          message: 'Invalid data received',
          error: new Error('Expected object, received: ' + typeof data),
        });
      }
      /**
       * Indica que a conexão foi concluída com sucesso
       */
      done = true;
      client.end();
    });

    /**
     * Trata o erro de conexão
     */
    client.on('error', err => {
      resolve({
        type: 'error',
        message: 'An error happened',
        error: err,
      });
      log.error(`Error: `, err);
    });

    /**
     * Trata o fechamento da conexão
     */
    client.on('close', hadError => {
      /**
       * Verifica se a conexão foi concluída com sucesso, do contrário, houve erro.
       */
      if (done) {
        return;
      }
      /**
       * Se a conexão foi fechada com erro, resolve a Promise com erro
       */
      if (hadError) {
        resolve({
          type: 'error',
          message: 'Connection closed with error',
          error: new Error('Connection closed with error'),
        });
        log.error('Connection closed with error');
        return;
      }
      /**
       * Se a conexão foi fechada antes de receber os dados, resolve a Promise com erro
       */
      resolve({
        type: 'error',
        message: 'Server closed connection',
        error: new Error('Server closed connection'),
      });
      log.error('Connection closed');
    });
  });
};

/**
 * Verifica se a resposta é um erro
 * @param response Resposta da requisição TCP
 * @returns true se a resposta for um erro, false caso contrário
 * @example
 * const response = await tcpRequest(data, host, port);
 * if (isTcpError(response)) {
 *   console.error(response.error);
 * } else {
 *   console.log(response.data);
 * }
 * @see {@link TCPResponse}
 * @see {@link tcpRequest}
 */
export function isTcpError<T>(
  response: TCPResponse<T>,
): response is TCPResponse<T> & { type: 'error' } {
  return response.type === 'error';
}
