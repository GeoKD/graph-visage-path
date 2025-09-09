import React from "react";
import { Graph, Edge } from "@/types/graph";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface IncidenceMatrixProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
}

export const IncidenceMatrix: React.FC<IncidenceMatrixProps> = ({
  graph,
  onGraphChange,
}) => {
  const handleWeightChange = (sourceId: string, targetId: string, weight: string) => {
    const numWeight = parseFloat(weight) || 0;
    
    if (numWeight <= 0) {
      // Remove edge if weight is 0 or invalid
      const updatedEdges = graph.edges.filter(
        edge => !(
          (edge.source === sourceId && edge.target === targetId) ||
          (edge.source === targetId && edge.target === sourceId)
        )
      );
      onGraphChange({ ...graph, edges: updatedEdges });
      return;
    }

    // Find existing edge
    const existingEdgeIndex = graph.edges.findIndex(
      edge => 
        (edge.source === sourceId && edge.target === targetId) ||
        (edge.source === targetId && edge.target === sourceId)
    );

    if (existingEdgeIndex >= 0) {
      // Update existing edge
      const updatedEdges = [...graph.edges];
      updatedEdges[existingEdgeIndex] = {
        ...updatedEdges[existingEdgeIndex],
        weight: numWeight,
      };
      onGraphChange({ ...graph, edges: updatedEdges });
    } else {
      // Create new edge
      const newEdge: Edge = {
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        weight: numWeight,
      };
      onGraphChange({ ...graph, edges: [...graph.edges, newEdge] });
    }
  };

  const getWeight = (sourceId: string, targetId: string): number => {
    const edge = graph.edges.find(
      edge => 
        (edge.source === sourceId && edge.target === targetId) ||
        (edge.source === targetId && edge.target === sourceId)
    );
    return edge ? edge.weight : 0;
  };

  const addNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 200 + 100,
      label: `${graph.nodes.length + 1}`,
    };
    onGraphChange({ ...graph, nodes: [...graph.nodes, newNode] });
  };

  const removeNode = (nodeId: string) => {
    const updatedNodes = graph.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = graph.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    onGraphChange({ nodes: updatedNodes, edges: updatedEdges });
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="w-full h-full bg-card rounded-lg border border-border p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">No Nodes</h3>
        <p className="text-muted-foreground mb-4">
          Double-click on the graph to create nodes or use the button below
        </p>
        <Button onClick={addNode} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Node
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Incidence Matrix</h3>
        <Button onClick={addNode} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Node
        </Button>
      </div>
      
      <div className="overflow-auto max-h-[calc(100%-60px)]">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground border-b border-border">
                From / To
              </th>
              {graph.nodes.map(node => (
                <th 
                  key={node.id} 
                  className="p-2 text-center text-sm font-medium text-foreground border-b border-border min-w-[80px]"
                >
                  <div className="flex items-center justify-center gap-2">
                    {node.label}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeNode(node.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {graph.nodes.map(sourceNode => (
              <tr key={sourceNode.id} className="border-b border-border/50">
                <td className="p-2 font-medium text-foreground bg-muted/30">
                  {sourceNode.label}
                </td>
                {graph.nodes.map(targetNode => {
                  const isDisabled = sourceNode.id === targetNode.id;
                  const weight = getWeight(sourceNode.id, targetNode.id);
                  
                  return (
                    <td key={targetNode.id} className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weight || ""}
                        onChange={(e) => handleWeightChange(sourceNode.id, targetNode.id, e.target.value)}
                        disabled={isDisabled}
                        className="w-full text-center h-8"
                        placeholder="0"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};