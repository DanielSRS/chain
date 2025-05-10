// helper class
export class GraphNode {
  val: string;
  priority: number;

  constructor(val: string, priority: number) {
    this.val = val;
    this.priority = priority;
  }
}

export class PriorityQueue {
  values: GraphNode[];

  constructor() {
    this.values = [];
  }
  enqueue(val: string, priority: number): void {
    const newNode = new GraphNode(val, priority);
    this.values.push(newNode);
    this.bubbleUp();
  }
  bubbleUp(): void {
    let idx = this.values.length - 1;
    const element = this.values[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.values[parentIdx];
      if (element.priority >= parent.priority) break;
      this.values[parentIdx] = element;
      this.values[idx] = parent;
      idx = parentIdx;
    }
  }
  dequeue(): GraphNode {
    const min = this.values[0];
    const end = this.values.pop();
    if (this.values.length > 0 && end) {
      this.values[0] = end;
      this.sinkDown();
    }
    return min;
  }
  sinkDown(): void {
    let idx = 0;
    const length = this.values.length;
    const element = this.values[0];
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;
      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx];
        if (leftChild.priority < element.priority) swap = leftChildIdx;
      }
      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null &&
            leftChild &&
            rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.values[idx] = this.values[swap];
      this.values[swap] = element;
      idx = swap;
    }
  }
}

export interface Neighbor {
  node: string;
  weight: number;
}

export interface PathResult {
  path: string[];
  cost: number;
}

export interface DijkstraResult {
  node: string;
  distance: number;
  path: string[];
}

export class WeightedGraph {
  adjacencyList: Record<string, Neighbor[]>;

  constructor() {
    this.adjacencyList = {};
  }

  addVertex(vertex: string): void {
    if (!this.adjacencyList[vertex]) this.adjacencyList[vertex] = [];
  }

  addEdge(vertex1: string, vertex2: string, weight: number): void {
    this.adjacencyList[vertex1].push({ node: vertex2, weight });
    this.adjacencyList[vertex2].push({ node: vertex1, weight });
  }

  findAllPaths(start: string, end: string): PathResult[] {
    const result: PathResult[] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[], cost: number): void => {
      if (current === end) {
        result.push({ path: [...path, current], cost });
        return;
      }

      visited.add(current);

      for (const neighbor of this.adjacencyList[current]) {
        if (!visited.has(neighbor.node)) {
          dfs(neighbor.node, [...path, current], cost + neighbor.weight);
        }
      }

      visited.delete(current); // backtrack
    };

    dfs(start, [], 0);

    // Ordena do menor custo para o maior
    return result.sort((a, b) => a.cost - b.cost);
  }

  Dijkstra(start: string): DijkstraResult[] {
    const nodes = new PriorityQueue();
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const paths: Record<string, string[]> = {};

    for (const vertex in this.adjacencyList) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(vertex, 0);
      } else {
        distances[vertex] = Infinity;
        nodes.enqueue(vertex, Infinity);
      }
      previous[vertex] = null;
    }

    while (nodes.values.length) {
      const smallest = nodes.dequeue().val;

      for (const neighbor of this.adjacencyList[smallest]) {
        const candidate = distances[smallest] + neighbor.weight;
        const nextNeighbor = neighbor.node;
        if (candidate < distances[nextNeighbor]) {
          distances[nextNeighbor] = candidate;
          previous[nextNeighbor] = smallest;
          nodes.enqueue(nextNeighbor, candidate);
        }
      }
    }

    for (const vertex in distances) {
      const path: string[] = [];
      let current = vertex;
      while (previous[current]) {
        path.push(current);
        current = previous[current]!;
      }
      if (current === start) path.push(start);
      paths[vertex] = path.reverse();
    }

    const sorted: DijkstraResult[] = Object.keys(distances)
      .filter((v) => v !== start)
      .map((v) => ({ node: v, distance: distances[v], path: paths[v] }))
      .sort((a, b) => a.distance - b.distance);

    return sorted;
  }
}
