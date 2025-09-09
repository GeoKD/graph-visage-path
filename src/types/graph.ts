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