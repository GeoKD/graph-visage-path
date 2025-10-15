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
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>("");

  const handleMouseDown = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
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
    if (!rect || graph.nodes.length >= 10) return;

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
    if (dragState.isDragging) {dragState.isDragging = false; return;}
    onNodeSelect?.(nodeId);
  }, [onNodeSelect]);

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNode(nodeId);
      setEditLabel(node.label);
    }
  }, [graph.nodes]);

  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEditLabel(event.target.value);
  }, []);

  const handleLabelSubmit = useCallback(() => {
    if (editingNode && editLabel.trim()) {
      const updatedNodes = graph.nodes.map(node =>
        node.id === editingNode ? { ...node, label: editLabel.trim() } : node
      );
      onGraphChange({ ...graph, nodes: updatedNodes });
    }
    setEditingNode(null);
    setEditLabel("");
  }, [editingNode, editLabel, graph, onGraphChange]);

  const handleLabelKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLabelSubmit();
    } else if (event.key === 'Escape') {
      setEditingNode(null);
      setEditLabel("");
    }
  }, [handleLabelSubmit]);

  const getNodeColor = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) return "hsl(var(--node-selected))";
    if (highlightedPath.includes(nodeId)) return "hsl(var(--path-highlight))";
    if (hoveredNode === nodeId) return "hsl(var(--node-hover))";
    return "hsl(var(--node-default))";
  };

  const isEdgeInPath = (edge: Edge) => {
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      const current = highlightedPath[i];
      const next = highlightedPath[i + 1];
      if ((edge.source === current && edge.target === next) || (edge.source === next && edge.target === current)) {
        return true;
      }
    }
    return false;
  };

  const getEdgeColor = (edge: Edge) => {
    return isEdgeInPath(edge) ? "hsl(var(--path-highlight))" : "hsl(var(--edge-default))";
  };

  const getEdgeWidth = (edge: Edge) => {
    return isEdgeInPath(edge) ? 3 : 2;
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

          // Check if there's a reverse edge
          const reverseEdge = graph.edges.find(
            e => e.source === edge.target && e.target === edge.source
          );

          // Calculate offset for bidirectional edges
          const hasReverseEdge = reverseEdge !== undefined;
          const offset = hasReverseEdge ? 15 : 0;

          // Calculate edge direction vector
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          // Normalized perpendicular vector
          const perpX = -dy / length;
          const perpY = dx / length;

          // Start and end points with offset
          const x1 = sourceNode.x + perpX * offset;
          const y1 = sourceNode.y + perpY * offset;
          const x2 = targetNode.x + perpX * offset;
          const y2 = targetNode.y + perpY * offset;

          // Calculate quadratic curve control point
          const midX = (x1 + x2) / 2 + perpX * offset;
          const midY = (y1 + y2) / 2 + perpY * offset;

          // Calculate label position (on the curve)
          const labelX = (x1 + x2) / 2 + perpX * offset;
          const labelY = (y1 + y2) / 2 + perpY * offset;

          const pathD = hasReverseEdge
            ? `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`
            : `M ${x1} ${y1} L ${x2} ${y2}`;

          return (
            <g key={edge.id}>
              <defs>
                <marker
                  id={`arrow-${edge.id}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerUnits="strokeWidth"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={getEdgeColor(edge)} />
                </marker>
              </defs>
              <path
                d={pathD}
                stroke={getEdgeColor(edge)}
                strokeWidth={getEdgeWidth(edge)}
                fill="none"
                markerEnd={`url(#arrow-${edge.id})`}
              />
              <circle
                cx={labelX}
                cy={labelY}
                r="12"
                fill="hsl(var(--card))"
                stroke={getEdgeColor(edge)}
                strokeWidth="2"
              />
              <text
                x={labelX}
                y={labelY}
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
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.id)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
            />
            {editingNode === node.id ? (
              <foreignObject x={node.x - 25} y={node.y - 12} width="50" height="24">
                <input
                  type="text"
                  value={editLabel}
                  onChange={handleLabelChange}
                  onBlur={handleLabelSubmit}
                  onKeyDown={handleLabelKeyDown}
                  autoFocus
                  className="w-full h-full text-center text-sm font-bold bg-card border border-primary rounded px-1"
                  style={{ outline: 'none' }}
                />
              </foreignObject>
            ) : (
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy="0.35em"
                className="text-sm font-bold fill-background pointer-events-none"
              >
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};