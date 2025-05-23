import type { ErrorCode } from './error-codes.js';

export interface Car {
  /**
   * Id do carro. O id deve ser um número inteiro.
   * O id deve ser único para cada carro.
   * @example 1
   */
  id: number;
  /**
   * Localização do carro.
   */
  location: Position;
  /**
   * Nivel da bateria do carro. O valor deve ser entre 0 e 100.
   * 0 significa que o carro está sem bateria e 100 significa
   * que o carro está totalmente carregado.
   * O valor deve ser um número inteiro.
   * @example 75
   * @example 100
   */
  batteryLevel: number;
}
/**
 * Representa a posição dentro do sistema de coordenadas.
 * O sistema de coordenadas é um plano cartesiano.
 * O ponto (0, 0) representa o canto inferior esquerdo do plano.
 * O ponto (x, y) representa a posição do carro ou da estação de carga.
 * O ponto (x, y) é um número inteiro.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * O estado da estação de carga.
 * O estado pode ser 'avaliable', 'charging-car' ou 'reserved'.
 * 'avaliable' significa que a estação está disponível para uso.
 * 'charging-car' significa que a estação está em uso e está
 * carregando um carro.
 * 'reserved' significa que a estação está reservada para um carro.
 */
export type StationState = 'avaliable' | 'charging-car' | 'reserved';

/**
 * Representa uma recarga.
 * Uma recarga é uma operação de carga de um carro em uma estação.
 * A recarga tem um id, um id de usuário, um id de estação,
 * um horário de início, um horário de término, um custo e um
 * status de pagamento.
 */
export type Charge = {
  /**
   * Id da recarga. O id deve ser um número inteiro.
   * O id deve ser único para cada recarga.
   * @example 1
   */
  chargeId: number;
  /**
   * Id do usuário. O id deve ser um número inteiro.
   * O id deve ser único para cada usuário.
   * O usuário associado ao id deve existir.
   */
  userId: number;
  /**
   * Id da estação. O id deve ser um número inteiro.
   * O id deve ser único para cada estação.
   * A estação associada ao id deve existir.
   */
  stationId: number;
  /**
   * Horário de início da recarga.
   * O horário deve ser uma data válida.
   */
  startTime: Date;
  /**
   * Horário de término da recarga.
   */
  endTime: Date;
  /**
   * Custo da recarga.
   */
  cost: number;
  /**
   * Status de pagamento da recarga.
   * true indica que a recarga foi paga.
   */
  hasPaid: boolean;
};

/**
 * Representa uma estação de carga.
 * Uma estação de carga é um ponto de recarga de um carro.
 * A estação tem um id, uma localização, um estado e uma lista de
 * reservas.
 */
export type Station = {
  /**
   * Id da estação. O id deve ser um número inteiro.
   * O id deve ser único para cada estação.
   */
  id: number;
  /**
   * Localização da estação no sistema de coordenadas.
   */
  location: Position;
  city: string;
  companyId: string;
  /**
   * Fila de espera da estação.
   * A fila de espera é uma lista de ids de usuários que
   * reservaram a estação.
   */
  reservations: number[];
  /**
   * Lista de carros/usuários para os quais a estação foi recomendada.
   * É usado pelo algoritmo de recomendação para distribuir a demanda
   * pelas estações de recarga
   */
  suggestions: number[];
} & STATION_STATE;

/**
 * Estado da estação.
 * O estado pode ser 'avaliable', 'charging-car' ou 'reserved'.
 * 'avaliable' significa que a estação está disponível para uso.
 * 'charging-car' significa que a estação está em uso e está
 * carregando um carro.
 * 'reserved' significa que a estação está reservada para um carro.
 *
 * Quando o estado for 'charging-car', o id da recarga
 * deve ser passado no campo onUse.
 */
type STATION_STATE =
  | {
      state: 'charging-car';
      /**
       * Id da recarga em uso.
       * O id deve ser um número inteiro.
       * O representa uma recarga existente.
       *
       * @see {Charge}
       */
      onUse: number;
    }
  | {
      state: 'avaliable';
    }
  | {
      state: 'reserved';
    };

export type User = Omit<Car, 'location' | 'batteryLevel'>;

export type StationGroup = Record<number, Station>;
export type ChargeRecord = Record<number, Charge>;
export type UserGroup = Record<number, User>;

/**
 * Cria uma nova estação de carga.
 * @param id O id da estação. O id deve ser um número inteiro.
 * @param x A coordenada x da estação no sistema de coordenadas.
 * @param y A coordenada y da estação no sistema de coordenadas.
 * @param state O estado da estação.
 * @returns Uma nova estação de carga.
 * @example
 * const station = Station(1, 10, 20, 'avaliable');
 * // station = {
 * // {
 * //   id: 1,
 * //   location: { x: 10, y: 20 },
 * //   state: 'avaliable',
 * //   reservations: [],
 * //   suggestions: [],
 * // }
 */
export function Station(
  id: number,
  x: number,
  y: number,
  state: StationState,
): Station {
  return {
    id,
    state,
    onUse: -1,
    location: {
      x,
      y,
    },
    city: 'Feira de Santana',
    companyId: '234WFSW#$',
    reservations: [],
    suggestions: [],
  };
}

/**
 * Mapeamento entre os tipos de requisição e resposta da API.
 * O mapeamento é usado para definir os tipos de entrada e saída
 * de cada endpoint da API.
 * Cada chave do mapeamento representa um endpoint da API.
 * O valor da chave é um objeto que contém os tipos de entrada e
 * saída do endpoint.
 * O tipo de entrada é o tipo de dado que deve ser enviado para
 * o endpoint.
 * O tipo de saída é o tipo de dado que o endpoint retorna.
 * O tipo de saída pode ser uma resposta de sucesso ou uma
 * resposta de erro.
 */
export type RequestResponseMap = {
  /**
   * Endpoint para obter reservar uma estação de carga.
   */
  reserve: {
    /**
     * Tipo de entrada da requisição.
     */
    input: {
      /**
       * O id do usuário que está reservando a estação.
       * O usuário deve existir.
       */
      userId: number;
      /**
       * O id da estação que está sendo reservada.
       * A estação deve existir.
       */
      stationId: number;
    };
    /**
     * Tipo de saída da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     */
    output: Response<undefined> | ErrorResponse<undefined | ErrorCode>;
  };
  /**
   * Endpoint para obter a sugestão de estações para recarregar o carro.
   */
  getSuggestions: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada é o carro que está solicitando a
     * sugestão de estações.
     * O carro deve existir.
     */
    input: Car;
    /**
     * Tipo de resposta da requisição.
     */
    output: Response<Station[]>;
  };
  /**
   * Endpoint para registrar uma nova estação de carga.
   */
  registerStation: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada é a estação que está sendo registrada.
     */
    input: Station;
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     * A resposta de sucesso contém a estação registrada.
     * A resposta de erro contém uma mensagem de erro.
     */
    output: Response<Station> | ErrorResponse<string>;
  };
  /**
   * Endpoint para registrar um novo usuário.
   */
  registerUser: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada é o usuário que está sendo registrado.
     */
    input: User;
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     * A resposta de sucesso contém o usuário registrado.
     */
    output: Response<User> | ErrorResponse<unknown>;
  };
  /**
   * Endpoint para iniciar uma recarga em uma estação de carga com um carro.
   */
  startCharging: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada são as informações do carro e da estação
     *
     */
    input: {
      /**
       * O id da estação que será usada para a recarga.
       * A estação deve existir.
       */
      stationId: number;
      /**
       * O id do carro que está sendo carregado.
       */
      userId: number;
      /**
       * O nível da bateria do carro.
       */
      battery_level: number;
    };
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     */
    output: Response<Charge> | ErrorResponse<string | ErrorCode>;
  };
  /**
   * Endpoint para finalizar uma recarga iniciada em uma estação de carga com um carro.
   */
  endCharging: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada são as informações do carro e da estação
     */
    input: {
      /**
       * O id da recarga que será finalizada.
       * A recarga deve existir.
       */
      chargeId: number;
      /**
       * O id da estação que está em uso.
       */
      stationId: number;
      /**
       * O id do carro que está sendo carregado.
       */
      userId: number;
      /**
       * O nível da bateria do carro.
       */
      battery_level: number;
    };
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     * A resposta de sucesso contém a recarga finalizada.
     */
    output: Response<Charge> | ErrorResponse<ErrorCode | string>;
  };
  /**
   * Endpoint para obter a lista de recargas de um usuário.
   * A lista de recargas é uma lista de objetos do tipo Charge.
   * Cada objeto da lista contém as informações de uma recarga.
   * A lista de recargas é filtrada pelo id do usuário.
   */
  rechargeList: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada é o id do usuário que está solicitando
     * a lista de recargas.
     * O id do usuário deve existir.
     */
    input: {
      /**
       * O id do usuário que está solicitando a lista de recargas.
       * O id do usuário deve existir.
       */
      userId: number;
    };
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     * A resposta de sucesso contém a lista de recargas do usuário.
     */
    output: Response<Charge[]> | ErrorResponse<ErrorCode | string>;
  };
  /**
   * Endpoint para realizar o pagamento de uma recarga.
   */
  payment: {
    /**
     * Tipo de entrada da requisição.
     * O tipo de entrada são as informações da recarga e do usuário
     * que está realizando o pagamento.
     */
    input: {
      /**
       * O id do usuário que está realizando o pagamento.
       * O id do usuário deve existir.
       */
      userId: number;
      /**
       * O id da recarga que será paga.
       * A recarga deve existir.
       */
      chargeId: number;
      hasPaid: boolean;
    };
    /**
     * Tipo de resposta da requisição.
     * A resposta pode ser uma resposta de sucesso ou uma
     * resposta de erro.
     * A resposta de sucesso contém a recarga paga.
     */
    output: Response<Charge> | ErrorResponse<ErrorCode | string>;
  };
  getStationInfo: {
    input: {
      /**
       * Id da estação
       */
      id: number;
    };
    output: Response<Station> | ErrorResponse<ErrorCode>;
  };
};

/**
 * Representa um request handler da API.
 * O request handler é uma função que recebe um
 * objeto de entrada e retorna um objeto de saída.
 * O objeto de entrada e o objeto de saída são definidos
 * pelo mapeamento de requisições e respostas da API.
 * O manipulador de requisições é usado para processar
 * as requisições da API e retornar as respostas.
 */
export type ApiRequestHandler<K extends keyof RequestResponseMap> = (
  data: RequestResponseMap[K]['input'],
) => RequestResponseMap[K]['output'];

export type RequestHandler<K extends keyof RequestResponseMap> = {
  data: RequestResponseMap[K]['input'];
  res: RequestResponseMap[K]['output'];
};

/**
 *  Api endpoint.
 *  O endpoint é uma string que representa o nome do endpoint.
 *  O endpoint é usado para identificar o manipulador de requisições
 *  da API.
 *  O endpoint é usado para enviar requisições para a API.
 */
type DefinedEndpoints = keyof RequestResponseMap;

/**
 * Representa uma requisição da API.
 * A requisição é um objeto que contém o tipo do endpoint
 * e os dados da requisição.
 * O tipo do endpoint é usado para identificar o manipulador
 * de requisições da API.
 * Os dados da requisição são os dados que devem ser enviados
 * para o endpoint.
 */
type ApiRequest = {
  type: DefinedEndpoints;
  data: RequestResponseMap[DefinedEndpoints]['input'];
};

/**
 * Representa uma requisição da API.
 * A requisição é um objeto que contém o tipo do endpoint
 * e os dados da requisição.
 * O tipo do endpoint é usado para identificar o manipulador
 * de requisições da API.
 * Os dados da requisição são os dados que devem ser enviados
 * para o endpoint.
 * O tipo da requisição é usado para identificar o manipulador
 * de requisições da API.
 * O tipo da requisição é usado para enviar requisições
 * para a API.
 */
export type Request = ApiRequest;

/**
 * Representa uma resposta da API.
 * Representa uma resposta de sucesso.
 */
export type Response<T> = {
  /**
   * Mensagem de sucesso
   */
  message: string;
  success: true;
  /**
   * Dados retornados pela API.
   * Os dados podem ser de qualquer tipo.
   * O tipo dos dados depende do endpoint da API.
   * @example { id: 1, name: 'Bom dia' }
   * @example null
   * @example undefined
   * @example [{ id: 1, name: 'Boa tarde' }]
   */
  data: T;
};

/**
 * Representa uma resposta de erro da API.
 */
export type ErrorResponse<T> = {
  /**
   * Mensagem de erro.
   */
  message: string;
  success: false;
  /**
   * Erro retornado pela API.
   * O erro pode ser de qualquer tipo.
   * O tipo do erro depende do endpoint da API.
   */
  error: T;
};

export type Reservations = Record<number, number[]>;

/**
 * Cria um novo carro.
 * @param id O id do carro. O id deve ser um número inteiro.
 * @param x A coordenada x do carro no sistema de coordenadas.
 * @param y A coordenada y do carro no sistema de coordenadas.
 * @returns Um novo carro.
 * @example
 * const car = Car(1, 10, 20);
 * // car = {
 * // {
 * //   id: 1,
 * //   location: { x: 10, y: 20 },
 * //   batteryLevel: 0,
 * // }
 */
export function Car(id: number, x: number, y: number): Car {
  return {
    id,
    location: {
      x,
      y,
    },
    batteryLevel: 0,
  };
}
