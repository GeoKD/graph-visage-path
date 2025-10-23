import { Graph } from "@/types/graph";

export interface FloydResult {
  distances: Record<string, Record<string, number>>;
  next: Record<string, Record<string, string | null>>;
  pairs: Array<{
    from: string;
    to: string;
    distance: number;
    path: string[];
  }>;
}

export function floyd(graph: Graph): FloydResult {
  const nodes = graph.nodes.map(n => n.id);
  const distances: Record<string, Record<string, number>> = {};
  const next: Record<string, Record<string, string | null>> = {};

  // Инициализация
  for (const i of nodes) {
    distances[i] = {};
    next[i] = {};
    for (const j of nodes) {
      if (i === j) {
        distances[i][j] = 0;
        next[i][j] = null;
      } else {
        distances[i][j] = Infinity;
        next[i][j] = null;
      }
    }
  }

  // Заполняем начальные дистанции из рёбер
  for (const edge of graph.edges) {
    distances[edge.source][edge.target] = edge.weight;
    next[edge.source][edge.target] = edge.target;
  }

  // Алгоритм Флойда-Уоршелла
  for (const k of nodes) {
    for (const i of nodes) {
      for (const j of nodes) {
        if (distances[i][k] + distances[k][j] < distances[i][j]) {
          distances[i][j] = distances[i][k] + distances[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  // Создаём массив всех пар с путями
  const pairs: FloydResult['pairs'] = [];
  
  for (const from of nodes) {
    for (const to of nodes) {
      if (from !== to && distances[from][to] !== Infinity) {
        const path: string[] = [];
        let current: string | null = from;
        
        while (current !== null && current !== to) {
          path.push(current);
          current = next[current][to];
        }
        
        if (current === to) {
          path.push(to);
          pairs.push({
            from,
            to,
            distance: distances[from][to],
            path
          });
        }
      }
    }
  }

  return { distances, next, pairs };
}
