import { Graph, PathResult } from "@/types/graph";

export function dijkstra(graph: Graph, startId: string, endId: string): PathResult {
  const nodes = graph.nodes.map(n => n.id); // Вершины
  const distances: Record<string, number> = {}; // Дистанции
  const previous: Record<string, string | null> = {}; // Родительские вершины
  const unvisited = new Set(nodes); // Не отмеченные вершины (не посещенные)

  // Начальные значения дистанции
  nodes.forEach(nodeId => {
    distances[nodeId] = nodeId === startId ? 0 : Infinity; // Для начальной вершины
    previous[nodeId] = null;                               // значение 0, для остальных ထ
  });

  while (unvisited.size > 0) {

    /* --Из непосещенных вершин находим вершину с минимальной дистанцией-- */
    let currentNode: string | null = null;
    let minDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }

    // Если не найдена следующая вершина...
    if (!currentNode || distances[currentNode] === Infinity) {
      break; // Пути не существует
    }

    if (currentNode === endId) {
      break; // Достигли конечной
    }

    /* --Обновляем минимальные дистанции к соседним вершинам-- */

    // Находим соседние вершины
    const outgoingEdges = graph.edges.filter(
      edge => edge.source === currentNode
    );

    for (const edge of outgoingEdges) {
      const neighborId = edge.target; // Соседняя вершина
      
      // Если вершина не помечена как посещенная...
      if (unvisited.has(neighborId)) {
        // Расчитываем дистанцию к соседней вершине
        const newDistance = distances[currentNode] + edge.weight; 
        
        // Если дистанция меньше минимальной, присвоенной ранее...
        if (newDistance < distances[neighborId]) {
          // Присваиваем минимальную дистанцию вершине
          distances[neighborId] = newDistance;
          // Отмечаем текущую вершину как родительскую для соседней
          previous[neighborId] = currentNode;
        }
      }
    }

    // Отмечаем вершину как посещенную
    unvisited.delete(currentNode);
  }

  /* --Рекоструируем минимальный путь-- */

  // Если не найден минимальный путь к конечной вершине...
  if (distances[endId] === Infinity) {
    // Путь не найден
    return { found: false, distance: 0, path: [] };
  }

  const path: string[] = [];
  let current: string | null = endId;
  
  // Проходим по родительским вершинам от конечной вершины и добавляем в начало массива
  // КОНЕЧНАЯ - B - C - НАЧАЛЬНАЯ
  // КОНЕЧНАЯ -> B - КОНЕЧНАЯ -> C - B - КОНЕЧНАЯ -> НАЧАЛЬНАЯ - C - B - КОНЕЧНАЯ 
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  // Путь найден
  return {
    found: true,
    distance: distances[endId],
    path
  };
}