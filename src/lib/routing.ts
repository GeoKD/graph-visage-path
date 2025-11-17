import { Graph, RoutingTable } from "@/types/graph";
import { dijkstra } from "./dijkstra";

export type RoutingMethod = 'virtual-circuit' | 'datagram';

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
