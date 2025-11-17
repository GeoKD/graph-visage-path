import { Graph, RoutingTable } from "@/types/graph";
import { dijkstra } from "./dijkstra";

export type RoutingMethod = 'virtual-circuit' | 'datagram' | 'random' | 'flooding' | 'fixed' | 'adaptive' | 'experience';

// Build routing tables using shortest paths (routing by experience)
export function buildRoutingTables(graph: Graph): RoutingTable {
  const routingTable: RoutingTable = {};

  graph.nodes.forEach(sourceNode => {
    const entries = graph.nodes
      .filter(destNode => destNode.id !== sourceNode.id)
      .map(destNode => {
        const result = dijkstra(graph, sourceNode.id, destNode.id);
        
        if (result.found && result.path.length > 1) {
          return {
            destination: destNode.id,
            nextHop: result.path[1], // Next node in the path
            distance: result.distance,
          };
        }
        
        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    routingTable[sourceNode.id] = entries;
  });

  return routingTable;
}

// Find route for virtual circuit (establishes path before transmission)
export function findVirtualCircuitRoute(
  graph: Graph,
  sourceId: string,
  destinationId: string
): string[] {
  const result = dijkstra(graph, sourceId, destinationId);
  return result.found ? result.path : [];
}

// Find route for datagram method using routing tables
export function findDatagramRoute(
  routingTable: RoutingTable,
  currentNodeId: string,
  destinationId: string,
  visitedNodes: Set<string> = new Set()
): string[] {
  if (currentNodeId === destinationId) {
    return [currentNodeId];
  }

  // Prevent loops
  if (visitedNodes.has(currentNodeId)) {
    return [];
  }

  visitedNodes.add(currentNodeId);

  const entries = routingTable[currentNodeId];
  if (!entries) return [];

  const entry = entries.find(e => e.destination === destinationId);
  if (!entry) return [];

  const nextRoute = findDatagramRoute(routingTable, entry.nextHop, destinationId, visitedNodes);
  if (nextRoute.length === 0) return [];

  return [currentNodeId, ...nextRoute];
}

// Random Routing: Choose random neighbor at each hop
export function findRandomRoute(
  graph: Graph,
  currentNodeId: string,
  destinationId: string,
  visitedNodes: Set<string> = new Set()
): string[] {
  if (currentNodeId === destinationId) {
    return [currentNodeId];
  }

  if (visitedNodes.has(currentNodeId)) {
    return [];
  }

  visitedNodes.add(currentNodeId);

  // Find all neighbors
  const neighbors = graph.edges
    .filter(e => e.source === currentNodeId || e.target === currentNodeId)
    .map(e => e.source === currentNodeId ? e.target : e.source)
    .filter(n => !visitedNodes.has(n));

  if (neighbors.length === 0) return [];

  // Pick random neighbor
  const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
  const nextRoute = findRandomRoute(graph, randomNeighbor, destinationId, visitedNodes);
  
  if (nextRoute.length === 0) return [];
  return [currentNodeId, ...nextRoute];
}

// Flooding: Send to all neighbors (returns multiple paths)
export function findFloodingRoutes(
  graph: Graph,
  sourceId: string,
  destinationId: string,
  maxHops: number = 10
): string[][] {
  const allPaths: string[][] = [];
  
  function flood(currentPath: string[], visited: Set<string>, hops: number) {
    const currentNode = currentPath[currentPath.length - 1];
    
    if (currentNode === destinationId) {
      allPaths.push([...currentPath]);
      return;
    }
    
    if (hops >= maxHops) return;
    
    const neighbors = graph.edges
      .filter(e => e.source === currentNode || e.target === currentNode)
      .map(e => e.source === currentNode ? e.target : e.source)
      .filter(n => !visited.has(n));
    
    neighbors.forEach(neighbor => {
      const newVisited = new Set(visited);
      newVisited.add(neighbor);
      flood([...currentPath, neighbor], newVisited, hops + 1);
    });
  }
  
  flood([sourceId], new Set([sourceId]), 0);
  return allPaths;
}

// Fixed Routing: Use predefined static routes
export function findFixedRoute(
  graph: Graph,
  sourceId: string,
  destinationId: string
): string[] {
  // Use shortest path as "fixed" route
  const result = dijkstra(graph, sourceId, destinationId);
  return result.found ? result.path : [];
}

// Adaptive Routing: Like experience-based but considers edge weights dynamically
export function findAdaptiveRoute(
  graph: Graph,
  routingTable: RoutingTable,
  sourceId: string,
  destinationId: string
): string[] {
  // Use routing table but recalculate if needed
  return findDatagramRoute(routingTable, sourceId, destinationId);
}

// Experience-Based Routing: Same as datagram
export function findExperienceRoute(
  routingTable: RoutingTable,
  sourceId: string,
  destinationId: string
): string[] {
  return findDatagramRoute(routingTable, sourceId, destinationId);
}
