export interface PathResult {
  path: string[];
  cost: number;
}

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
