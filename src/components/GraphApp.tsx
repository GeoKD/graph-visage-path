import React, { useState } from "react";
import { Graph } from "@/types/graph";
import { GraphVisualization } from "./GraphVisualization";
import { IncidenceMatrix } from "./IncidenceMatrix";
import { PathFinder } from "./PathFinder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Grid3X3, Calculator } from "lucide-react";

export const GraphApp: React.FC = () => {
  const [graph, setGraph] = useState<Graph>({
    nodes: [
      { id: "node1", x: 150, y: 100, label: "A" },
      { id: "node2", x: 350, y: 100, label: "B" },
      { id: "node3", x: 250, y: 200, label: "C" },
      { id: "node4", x: 450, y: 200, label: "D" },
    ],
    edges: [
      { id: "edge1", source: "node1", target: "node2", weight: 5 },
      { id: "edge2", source: "node2", target: "node3", weight: 3 },
      { id: "edge3", source: "node1", target: "node3", weight: 8 },
      { id: "edge4", source: "node3", target: "node4", weight: 2 },
    ],
  });

  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else if (prev.length < 2) {
        return [...prev, nodeId];
      } else {
        return [nodeId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Graph Theory Visualizer
          </h1>
          <p className="text-lg text-muted-foreground">
            Interactive graph manipulation with Dijkstra's shortest path algorithm
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              Visual Graph
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Grid3X3 className="h-3 w-3" />
              Incidence Matrix
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Dijkstra's Algorithm
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Graph Visualization
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Double-click to add nodes • Drag to move • Click to select
                </p>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)]">
                <GraphVisualization
                  graph={graph}
                  onGraphChange={setGraph}
                  highlightedPath={highlightedPath}
                  selectedNodes={selectedNodes}
                  onNodeSelect={handleNodeSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <PathFinder
              graph={graph}
              onPathHighlight={setHighlightedPath}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Graph Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nodes:</span>
                  <Badge variant="outline">{graph.nodes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Edges:</span>
                  <Badge variant="outline">{graph.edges.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  <Badge variant="outline">{selectedNodes.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Incidence Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Incidence Matrix
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Edit weights directly in the matrix • Set to 0 to remove edges
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <IncidenceMatrix
                graph={graph}
                onGraphChange={setGraph}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};