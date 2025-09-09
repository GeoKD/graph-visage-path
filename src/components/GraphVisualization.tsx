import React, { useState, useRef, useCallback } from "react";
import { Node, Edge, Graph, DragState } from "@/types/graph";

interface GraphVisualizationProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  highlightedPath?: string[];
  selectedNodes?: string[];
  onNodeSelect?: (nodeId: string) => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graph,
  onGraphChange,
  highlightedPath = [],
  selectedNodes = [],
  onNodeSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
  });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const handleMouseDown = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setDragState({
      isDragging: true,
      nodeId,
      offset: {
        x: mouseX - node.x,
        y: mouseY - node.y,
      },
    });
  }, [graph.nodes]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.nodeId) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const newX = mouseX - dragState.offset.x;
    const newY = mouseY - dragState.offset.y;

    const updatedNodes = graph.nodes.map(node =>
      node.id === dragState.nodeId
        ? { ...node, x: Math.max(20, Math.min(580, newX)), y: Math.max(20, Math.min(380, newY)) }
        : node
    );

    onGraphChange({ ...graph, nodes: updatedNodes });
  }, [dragState, graph, onGraphChange]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      nodeId: null,
      offset: { x: 0, y: 0 },
    });
  }, []);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      x: mouseX,
      y: mouseY,
      label: `${graph.nodes.length + 1}`,
    };

    onGraphChange({
      ...graph,
      nodes: [...graph.nodes, newNode],
    });
  }, [graph, onGraphChange]);

  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeSelect?.(nodeId);
  }, [onNodeSelect]);

  const getNodeColor = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) return "hsl(var(--node-selected))";
    if (highlightedPath.includes(nodeId)) return "hsl(var(--path-highlight))";
    if (hoveredNode === nodeId) return "hsl(var(--node-hover))";
    return "hsl(var(--node-default))";
  };

  const getEdgeColor = (edge: Edge) => {
    const isInPath = highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target);
    return isInPath ? "hsl(var(--path-highlight))" : "hsl(var(--edge-default))";
  };

  const getEdgeWidth = (edge: Edge) => {
    const isInPath = highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target);
    return isInPath ? 3 : 2;
  };

  return (
    <div className="w-full h-full bg-graph-canvas rounded-lg border border-border overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 600 400"
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="hsl(var(--graph-grid))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        {graph.edges.map(edge => {
          const sourceNode = graph.nodes.find(n => n.id === edge.source);
          const targetNode = graph.nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={getEdgeColor(edge)}
                strokeWidth={getEdgeWidth(edge)}
                className="transition-all duration-200"
              />
              <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="hsl(var(--card))"
                stroke={getEdgeColor(edge)}
                strokeWidth="2"
                className="transition-all duration-200"
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dy="0.35em"
                className="text-xs font-semibold fill-foreground pointer-events-none"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="18"
              fill={getNodeColor(node.id)}
              stroke="hsl(var(--background))"
              strokeWidth="3"
              className="cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110"
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.id)}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dy="0.35em"
              className="text-sm font-bold fill-background pointer-events-none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};