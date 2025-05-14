import { calcRecomendations } from '../main.ts';
import { curry } from '../utils/curry.ts';
import {
  filterStationsByDistanceRadius,
  type Car,
  type RequestHandler,
  type StationGroup,
} from '../utils/types.ts';

type Handler = RequestHandler<'getSuggestions'>;

export const getSuggestions = curry(
  (
    MAX_RADIUS: number,
    STATIONS: StationGroup,
    data: Handler['data'],
  ): Handler['res'] => {
    const res = generateSuggestions(MAX_RADIUS, STATIONS, data);
    return {
      message: 'Lista de recomendações',
      success: true,
      data: res,
    };
  },
);

function generateSuggestions(
  maxRadius: number,
  stations: StationGroup,
  car: Car,
) {
  const stationList = Object.values(stations);
  // Verificar se o carro já recebeu alguma sugestão
  const stationWithSuggestion = stationList.find(station =>
    station.suggestions.includes(car.id),
  );

  // Remove sugestão se houver
  if (stationWithSuggestion) {
    const carIndex = stationWithSuggestion.suggestions.findIndex(
      id => id === car.id,
    );
    if (carIndex !== -1) {
      stationWithSuggestion.suggestions.splice(carIndex, 1);
    }
  }

  // Limita as recomendações a um determinado raio de distância do veículo
  const filteredStations = filterStationsByDistanceRadius(
    maxRadius,
    stationList,
    car,
  );

  // calcula recomendações
  const recommendations = calcRecomendations(filteredStations, car);

  // Registra sugestão feita
  recommendations[0]?.suggestions.push(car.id);
  return recommendations;
}
