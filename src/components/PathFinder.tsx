import React, { useState } from "react";
import { Graph, PathResult } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Navigation, AlertCircle } from "lucide-react";
import { dijkstra } from "@/lib/dijkstra";
import { floyd, FloydResult } from "@/lib/floyd";
import { LABELS } from "@/constants/labels";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PathFinderProps {
  graph: Graph;
  onPathHighlight: (path: string[]) => void;
}

export const PathFinder: React.FC<PathFinderProps> = ({
  graph,
  onPathHighlight,
}) => {
  const [algorithm, setAlgorithm] = useState<"dijkstra" | "floyd">("dijkstra");
  const [startNode, setStartNode] = useState<string>("");
  const [endNode, setEndNode] = useState<string>("");
  const [result, setResult] = useState<PathResult | null>(null);
  const [floydResult, setFloydResult] = useState<FloydResult | null>(null);

  const findPath = () => {
    if (algorithm === "dijkstra") {
      if (!startNode || !endNode || startNode === endNode) return;
      
      const pathResult = dijkstra(graph, startNode, endNode);
      setResult(pathResult);
      setFloydResult(null);
      onPathHighlight(pathResult.found ? pathResult.path : []);
    } else {
      const floydRes = floyd(graph);
      setFloydResult(floydRes);
      setResult(null);
      onPathHighlight([]);
    }
  };

  const clearPath = () => {
    setResult(null);
    setFloydResult(null);
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
          {LABELS.SHORTEST_PATH}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {LABELS.ALGORITHM}
          </label>
          <Select value={algorithm} onValueChange={(val: "dijkstra" | "floyd") => setAlgorithm(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dijkstra">{LABELS.DIJKSTRA}</SelectItem>
              <SelectItem value="floyd">{LABELS.FLOYD}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {algorithm === "dijkstra" && (
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {LABELS.START_NODE}
            </label>
            <Select value={startNode} onValueChange={setStartNode}>
              <SelectTrigger>
                <SelectValue placeholder={LABELS.SELECT_START} />
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
              {LABELS.END_NODE}
            </label>
            <Select value={endNode} onValueChange={setEndNode}>
              <SelectTrigger>
                <SelectValue placeholder={LABELS.SELECT_END} />
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
        )}

      <div className="flex gap-2">
        <Button 
          onClick={findPath} 
          disabled={algorithm === "dijkstra" && (!startNode || !endNode || startNode === endNode)}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {LABELS.FIND_PATH}
        </Button>
          <Button onClick={clearPath} variant="outline">
            {LABELS.CLEAR}
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          {result.found ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {LABELS.PATH_FOUND}
                </Badge>
                <span className="text-sm font-medium">
                  {LABELS.DISTANCE} {result.distance.toFixed(2)}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{LABELS.PATH}</p>
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
                {LABELS.NO_PATH} {getNodeLabel(startNode)} и {getNodeLabel(endNode)}
              </span>
            </div>
          )}
        </div>
      )}

      {floydResult && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-foreground mb-3">
            {LABELS.ALL_PAIRS_PATHS} ({floydResult.pairs.length})
          </p>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {floydResult.pairs.map((pair, idx) => (
                <div key={idx} className="p-2 bg-background rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getNodeLabel(pair.from)} → {getNodeLabel(pair.to)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {LABELS.DISTANCE} {pair.distance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pair.path.map((nodeId, index) => (
                      <React.Fragment key={`${idx}-${nodeId}-${index}`}>
                        <span className="text-xs">{getNodeLabel(nodeId)}</span>
                        {index < pair.path.length - 1 && (
                          <span className="text-xs text-muted-foreground">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </CardContent>
  </Card>
  );
};