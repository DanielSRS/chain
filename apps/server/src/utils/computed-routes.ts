// import Computed from './res.json' with { type: 'json' };
import type { City } from './cities.ts';
import type { PathResult } from './weighted-graph.ts';
import {
  bahiaCitiesGraph,
  computedRoutesFileName,
  findAllRoutes,
  saveComputedRoutes,
} from './routes-generator.ts';

const Computed = await import('./' + computedRoutesFileName, {
  with: { type: 'json' },
})
  .then(module => {
    // console.log('JSON file loaded successfully');
    return module.default;
  })
  .catch(() => {
    // console.error('Error loading JSON file:', error);
    // console.error('Recomputing routes...');
    const routes = findAllRoutes(bahiaCitiesGraph);
    saveComputedRoutes(undefined, routes);
    return routes;
  });

/**
 * The result of the Dijkstra algorithm computed for all cities
 * ahead of time
 */
export type ComputedRoutes = {
  /**
   * The origin city
   */
  [key in City]: {
    /**
     * The destination city
     */
    [key in City]: PathResult[];
  };
};

/**
 * Partial computation of the Dijkstra algorithm executed for all cities
 */
export type PartialComputedRoutes = {
  /**
   * The origin city
   */
  [key in City]: Partial<{
    /**
     * The destination city
     */
    [key in City]: PathResult[];
  }>;
};

export const ComputedRoutes = Computed as ComputedRoutes;
