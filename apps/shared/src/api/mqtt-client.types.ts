export interface PathResult {
  path: string[];
  cost: number;
}

// Import types from main types file
import type {
  Station,
  User,
  Charge,
  Position,
  Response,
  ErrorResponse,
} from '../utils/main.types.js';

export type MqttApiEndpointsMap = {
  cities: {
    requestTopic: 'cities';
    responseTopic: 'cities/response';
    requestData: object;
    /**
     * List of cities
     */
    responseData: readonly string[];
  };
  routes: {
    requestTopic: 'routes';
    responseTopic: 'routes/response';
    requestData: {
      departure: string;
      destination: string;
    };
    /**
     * List of routes
     */
    responseData: readonly PathResult[];
  };
  getSuggestions: {
    requestTopic: 'getSuggestions';
    responseTopic: 'getSuggestions/response';
    requestData: {
      id: number;
      location: Position;
    };
    responseData: Response<Station[]>;
  };
  reserve: {
    requestTopic: 'reserve';
    responseTopic: 'reserve/response';
    requestData: {
      userId: number;
      stationId: number;
    };
    responseData: Response<undefined> | ErrorResponse<undefined | string>;
  };
  registerUser: {
    requestTopic: 'registerUser';
    responseTopic: 'registerUser/response';
    requestData: User;
    responseData: Response<User> | ErrorResponse<unknown>;
  };
  startCharging: {
    requestTopic: 'startCharging';
    responseTopic: 'startCharging/response';
    requestData: {
      stationId: number;
      userId: number;
      battery_level: number;
    };
    responseData: Response<Charge> | ErrorResponse<string>;
  };
  endCharging: {
    requestTopic: 'endCharging';
    responseTopic: 'endCharging/response';
    requestData: {
      stationId: number;
      userId: number;
      battery_level: number;
    };
    responseData: Response<Charge> | ErrorResponse<string>;
  };
  rechargeList: {
    requestTopic: 'rechargeList';
    responseTopic: 'rechargeList/response';
    requestData: {
      userId: number;
    };
    responseData: Response<Charge[]> | ErrorResponse<string>;
  };
  payment: {
    requestTopic: 'payment';
    responseTopic: 'payment/response';
    requestData: {
      userId: number;
      chargeId: number;
      hasPaid: boolean;
    };
    responseData: Response<Charge> | ErrorResponse<string>;
  };
  getStationInfo: {
    requestTopic: 'getStationInfo';
    responseTopic: 'getStationInfo/response';
    requestData: {
      id: number;
    };
    responseData: Response<Station> | ErrorResponse<string>;
  };
  reserveMultipleStations: {
    requestTopic: 'reserveMultipleStations';
    responseTopic: 'reserveMultipleStations/response';
    requestData: {
      stationIds: number[];
      userId: number;
      startTime: number;
      estimatedStopTimes: number[];
    };
    responseData:
      | Response<{
          success: boolean;
          reservationIds?: number[];
          message: string;
          stationErrors?: { stationId: number; error: string }[];
        }>
      | ErrorResponse<string>;
  };
};

export type MqttApiEndpointsKeys = keyof MqttApiEndpointsMap;

export type MqttApiRequestHandler<K extends MqttApiEndpointsKeys> = (
  data: MqttApiEndpointsMap[K]['requestData'],
) => {
  data: MqttApiEndpointsMap[K]['responseData'];
  responseTopic: MqttApiEndpointsMap[K]['responseTopic'];
};

export type MqttApiRequest = {
  type: MqttApiEndpointsKeys;
  data: MqttApiEndpointsMap[MqttApiEndpointsKeys]['requestData'];
};

// export type MqttApiEndpoints = {
//   [K in keyof MqttApiEndpointsMap]: {
//     requestTopic: MqttApiEndpointsMap[K]['requestTopic'];
//     responseTopic: MqttApiEndpointsMap[K]['responseTopic'];
//     requestData: MqttApiEndpointsMap[K]['requestData'];
//     responseData: MqttApiEndpointsMap[K]['responseData'];
//   };
// }[keyof MqttApiEndpointsMap];

// export type MqttApiResponse<T extends MqttApiEndpoints> = T['responseData'];
// export type MqttApiRequest<T extends MqttApiEndpoints> = T['requestData'];
// export type MqttApiRequestTopic<T extends MqttApiEndpoints> = T['requestTopic'];
// export type MqttApiResponseTopic<T extends MqttApiEndpoints> =
//   T['responseTopic'];
// export type MqttApiResponseData<T extends MqttApiEndpoints> =
//   T['responseData'] extends { data: infer R } ? R : never;
