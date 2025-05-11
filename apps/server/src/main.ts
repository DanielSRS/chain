import { curry } from './utils/curry';
import { calculateDistance, type Car, type Station } from './utils/types';

/**
 * Calcula a recomendação de postos de recarga para um determinado carro
 * dado o conjunto de pontos de recarga e um carro
 */
export const calcRecomendations = curry(
  (stations: Station[], car: Car): Station[] => {
    return stations.toSorted((a, b) => {
      /**
       * Se as estações tem status diferents
       */
      if (a.state !== b.state) {
        /**
         * se b está disponivel, implica em a estando ocupado
         * ou reservado
         */
        if (b.state === 'avaliable') {
          return 1; // Manda para o inicio da lista
        }

        /**
         * ou o inverso
         */
        if (a.state === 'avaliable') {
          return -1; // Manda para o fim da lista
        }
      }

      // Prioriza postos com menos reservas
      if (a.reservations.length !== b.reservations.length) {
        return a.reservations.length - b.reservations.length;
      }

      const distanceAC = calculateDistance(car.location, a.location);
      const distanceBC = calculateDistance(car.location, b.location);
      if (distanceAC !== distanceBC) {
        return distanceAC - distanceBC;
      }

      // Prioriza postos com menos sugestões
      return a.suggestions.length - b.suggestions.length;
    });
  },
);
