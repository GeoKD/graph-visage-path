export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface PathResult {
  found: boolean;
  distance: number;
  path: string[];
}

export interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: { x: number; y: number };
}

export interface Packet {
  id: string;
  number: number;
  sourceId: string;
  destinationId: string;
  size: number;
  currentNodeId: string;
  route: string[];
  routeIndex: number;
  status: 'waiting' | 'transmitting' | 'delivered';
  color: string;
  progress: number; // 0 to 1, position along current edge
  startTime: number;
  endTime?: number;
}

export interface TransmissionRecord {
  packetNumber: number;
  path: string;
  size: number;
  startTime: number;
  endTime: number;
  duration: string;
}

export interface RoutingTableEntry {
  destination: string;
  nextHop: string;
  distance: number;
}

export interface RoutingTable {
  [nodeId: string]: RoutingTableEntry[];
}