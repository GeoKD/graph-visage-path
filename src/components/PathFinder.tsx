import React, { useState } from "react";
import { Graph, PathResult } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Navigation, AlertCircle } from "lucide-react";
import { dijkstra } from "@/lib/dijkstra";

interface PathFinderProps {
  graph: Graph;
  onPathHighlight: (path: string[]) => void;
}

export const PathFinder: React.FC<PathFinderProps> = ({
  graph,
  onPathHighlight,
}) => {
  const [startNode, setStartNode] = useState<string>("");
  const [endNode, setEndNode] = useState<string>("");
  const [result, setResult] = useState<PathResult | null>(null);

  const findPath = () => {
    if (!startNode || !endNode || startNode === endNode) return;
    
    const pathResult = dijkstra(graph, startNode, endNode);
    setResult(pathResult);
    onPathHighlight(pathResult.found ? pathResult.path : []);
  };

  const clearPath = () => {
    setResult(null);
    onPathHighlight([]);
  };

  const getNodeLabel = (nodeId: string) => {
    return graph.nodes.find(n => n.id === nodeId)?.label || nodeId;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Shortest Path Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Start Node
            </label>
            <Select value={startNode} onValueChange={setStartNode}>
              <SelectTrigger>
                <SelectValue placeholder="Select start" />
              </SelectTrigger>
              <SelectContent>
                {graph.nodes.map(node => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              End Node
            </label>
            <Select value={endNode} onValueChange={setEndNode}>
              <SelectTrigger>
                <SelectValue placeholder="Select end" />
              </SelectTrigger>
              <SelectContent>
                {graph.nodes.map(node => (
                  <SelectItem key={node.id} value={node.id} disabled={node.id === startNode}>
                    {node.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={findPath} 
            disabled={!startNode || !endNode || startNode === endNode}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Find Path
          </Button>
          <Button onClick={clearPath} variant="outline">
            Clear
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            {result.found ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    Path Found
                  </Badge>
                  <span className="text-sm font-medium">
                    Distance: {result.distance.toFixed(2)}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Path:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.path.map((nodeId, index) => (
                      <React.Fragment key={nodeId}>
                        <Badge variant="outline" className="border-primary text-primary">
                          {getNodeLabel(nodeId)}
                        </Badge>
                        {index < result.path.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  No path exists between {getNodeLabel(startNode)} and {getNodeLabel(endNode)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};