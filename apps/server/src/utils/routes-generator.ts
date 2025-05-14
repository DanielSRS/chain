import fs from 'node:fs';
import path from 'node:path';
import { CITIES } from './cities.ts';
import { WeightedGraph } from './weighted-graph.ts';
import type {
  ComputedRoutes,
  PartialComputedRoutes,
} from './computed-routes.ts';

/**
 * The graph of cities in Bahia, Brazil
 */
export const bahiaCitiesGraph = new WeightedGraph();

/**
 * Graph of cities in Bahia, Brazil
 */
CITIES.forEach(city => bahiaCitiesGraph.addVertex(city));

/**
 * Connections between cities
 * The weights are the distances in kilometers
 */
bahiaCitiesGraph.addEdge('Salvador', 'Feira de Santana', 120);
bahiaCitiesGraph.addEdge('Salvador', 'Lauro de Freitas', 25);
bahiaCitiesGraph.addEdge('Lauro de Freitas', 'Camaçari', 35);
bahiaCitiesGraph.addEdge('Camaçari', 'Alagoinhas', 110);
bahiaCitiesGraph.addEdge('Feira de Santana', 'Santo Antônio de Jesus', 90);
bahiaCitiesGraph.addEdge('Feira de Santana', 'Serrinha', 80);
bahiaCitiesGraph.addEdge('Serrinha', 'Paulo Afonso', 310);
bahiaCitiesGraph.addEdge('Feira de Santana', 'Jequié', 280);
bahiaCitiesGraph.addEdge('Jequié', 'Vitória da Conquista', 160);
bahiaCitiesGraph.addEdge('Vitória da Conquista', 'Itabuna', 210);
bahiaCitiesGraph.addEdge('Ilhéus', 'Itabuna', 40);
bahiaCitiesGraph.addEdge('Jequié', 'Ilhéus', 150);
bahiaCitiesGraph.addEdge('Itabuna', 'Eunápolis', 220);
bahiaCitiesGraph.addEdge('Eunápolis', 'Porto Seguro', 60);
bahiaCitiesGraph.addEdge('Teixeira de Freitas', 'Eunápolis', 160);
bahiaCitiesGraph.addEdge('Teixeira de Freitas', 'Vitória da Conquista', 350);
bahiaCitiesGraph.addEdge('Barreiras', 'Irecê', 370);
bahiaCitiesGraph.addEdge('Juazeiro', 'Irecê', 210);
bahiaCitiesGraph.addEdge('Juazeiro', 'Paulo Afonso', 150);
bahiaCitiesGraph.addEdge('Jacobina', 'Irecê', 190);
bahiaCitiesGraph.addEdge('Feira de Santana', 'Jacobina', 330);
bahiaCitiesGraph.addEdge('Salvador', 'Simões Filho', 25);
bahiaCitiesGraph.addEdge('Simões Filho', 'Camaçari', 40);
bahiaCitiesGraph.addEdge('Simões Filho', 'Feira de Santana', 90);
bahiaCitiesGraph.addEdge('Santo Antônio de Jesus', 'Jequié', 180);
bahiaCitiesGraph.addEdge('Ilhéus', 'Porto Seguro', 280);
bahiaCitiesGraph.addEdge('Barreiras', 'Juazeiro', 470);
bahiaCitiesGraph.addEdge('Barreiras', 'Jacobina', 570);
bahiaCitiesGraph.addEdge('Juazeiro', 'Jacobina', 260);
bahiaCitiesGraph.addEdge('Juazeiro', 'Feira de Santana', 400);
bahiaCitiesGraph.addEdge('Irecê', 'Jacobina', 190); // já existe, mantém conectividade
bahiaCitiesGraph.addEdge('Eunápolis', 'Jequié', 310);
bahiaCitiesGraph.addEdge('Teixeira de Freitas', 'Itabuna', 330);
bahiaCitiesGraph.addEdge('Feira de Santana', 'Camaçari', 100); // rota alternativa ao norte de Salvador
bahiaCitiesGraph.addEdge('Salvador', 'Camaçari', 50); // conexão direta pela orla
bahiaCitiesGraph.addEdge('Alagoinhas', 'Serrinha', 95);
bahiaCitiesGraph.addEdge('Alagoinhas', 'Feira de Santana', 110);

/**
 * Find all paths between cities
 */
export function findAllRoutes(graph: WeightedGraph) {
  const result: Partial<PartialComputedRoutes> = {};
  for (const origin of CITIES) {
    result[origin] = {};

    for (const destination of CITIES) {
      if (origin === destination) continue;

      const paths = graph.findAllPaths(origin, destination);

      result[origin][destination] = paths.map(p => ({
        path: p.path,
        cost: p.cost,
      }));
    }
  }
  return result as ComputedRoutes;
}

export const computedRoutesFileName = 'computed-routes.json';

/**
 * File path to save the computed routes
 */
const filePath = path.join(import.meta.dirname, computedRoutesFileName);

/**
 * Save the computed routes to a JSON file
 */
export function saveComputedRoutes(
  path: string = filePath,
  computed?: ComputedRoutes,
) {
  const computedRoutes = computed ?? findAllRoutes(bahiaCitiesGraph);
  fs.writeFileSync(path, JSON.stringify(computedRoutes, null, 2), 'utf-8');
  // console.log(`Computed routes saved to ${path}`);
  return computedRoutes;
}
