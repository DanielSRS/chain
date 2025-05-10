import type { Car, Position, Station } from './main.types.js';

/**
 * Calcula a distancia entre dois pontos
 */
export function calculateDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function filterStationsByDistanceRadius(
  maxRadius: number,
  stations: Station[],
  car: Car,
) {
  return stations.filter(station => {
    const distancia = calculateDistance(station.location, car.location);
    return distancia <= maxRadius;
  });
}
