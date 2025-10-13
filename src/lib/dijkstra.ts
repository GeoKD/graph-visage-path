import { Graph, PathResult } from "@/types/graph";

export function dijkstra(graph: Graph, startId: string, endId: string): PathResult {
  const nodes = graph.nodes.map(n => n.id);
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(nodes);

  // Initialize distances
  nodes.forEach(nodeId => {
    distances[nodeId] = nodeId === startId ? 0 : Infinity;
    previous[nodeId] = null;
  });

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentNode: string | null = null;
    let minDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }

    if (!currentNode || distances[currentNode] === Infinity) {
      break; // No path exists
    }

    if (currentNode === endId) {
      break; // Reached target
    }

    unvisited.delete(currentNode);

    // Update distances to neighbors (directed graph: only follow edges from source)
    const outgoingEdges = graph.edges.filter(
      edge => edge.source === currentNode
    );

    for (const edge of outgoingEdges) {
      const neighborId = edge.target;
      
      if (unvisited.has(neighborId)) {
        const newDistance = distances[currentNode] + edge.weight;
        
        if (newDistance < distances[neighborId]) {
          distances[neighborId] = newDistance;
          previous[neighborId] = currentNode;
        }
      }
    }
  }

  // Reconstruct path
  if (distances[endId] === Infinity) {
    return { found: false, distance: 0, path: [] };
  }

  const path: string[] = [];
  let current: string | null = endId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    found: true,
    distance: distances[endId],
    path
  };
}