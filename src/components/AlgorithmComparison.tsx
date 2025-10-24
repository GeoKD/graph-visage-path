import React, { useState } from "react";
import { Graph } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Timer } from "lucide-react";
import { dijkstra } from "@/lib/dijkstra";
import { floyd } from "@/lib/floyd";
import { LABELS } from "@/constants/labels";
import { GraphVisualization } from "./GraphVisualization";

interface AlgorithmComparisonProps {
  graph: Graph;
  onRun?: () => void;
}

interface ComparisonResult {
  dijkstraTime: number;
  floydTime: number;
  dijkstraPairs: Array<{
    from: string;
    to: string;
    distance: number;
    path: string[];
  }>;
  floydPairs: Array<{
    from: string;
    to: string;
    distance: number;
    path: string[];
  }>;
}

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({ graph, onRun }) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const getNodeLabel = (nodeId: string) => {
    return graph.nodes.find(n => n.id === nodeId)?.label || nodeId;
  };

  const runComparison = () => {
    onRun?.();
    const nodes = graph.nodes.map(n => n.id);
    
    // Запускаем Dijkstra для всех пар
    const dijkstraStart = performance.now();
    const dijkstraPairs: ComparisonResult['dijkstraPairs'] = [];
    
    for (const from of nodes) {
      for (const to of nodes) {
        if (from !== to) {
          const pathResult = dijkstra(graph, from, to);
          if (pathResult.found) {
            dijkstraPairs.push({
              from,
              to,
              distance: pathResult.distance,
              path: pathResult.path
            });
          }
        }
      }
    }
    
    const dijkstraEnd = performance.now();
    const dijkstraTime = dijkstraEnd - dijkstraStart;
    
    // Запускаем Floyd-Warshall
    const floydStart = performance.now();
    const floydResult = floyd(graph);
    const floydEnd = performance.now();
    const floydTime = floydEnd - floydStart;
    
    setResult({
      dijkstraTime,
      floydTime,
      dijkstraPairs,
      floydPairs: floydResult.pairs
    });
  };

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full">
        <GraphVisualization
          graph={graph}
          onGraphChange={() => {}}
          onNodeSelect={() => {}}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{LABELS.ALGORITHM_COMPARISON}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runComparison} className="w-full">
            <Timer className="h-4 w-4 mr-2" />
            {LABELS.RUN_COMPARISON}
          </Button>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">{LABELS.DIJKSTRA}</p>
                  <Badge variant="secondary">
                    {result.dijkstraTime.toFixed(2)} мс
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.dijkstraPairs.length} {LABELS.PAIRS_FOUND}
                  </p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">{LABELS.FLOYD}</p>
                  <Badge variant="secondary">
                    {result.floydTime.toFixed(2)} мс
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.floydPairs.length} {LABELS.PAIRS_FOUND}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium mb-2">{LABELS.WINNER}</p>
                <Badge className="bg-primary text-primary-foreground">
                  {result.dijkstraTime < result.floydTime ? LABELS.DIJKSTRA : LABELS.FLOYD}
                  {' - '}
                  {Math.abs(result.dijkstraTime - result.floydTime).toFixed(2)} мс {LABELS.FASTER}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {LABELS.DIJKSTRA} - {LABELS.ALL_SHORTEST_PATHS}
                  </p>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {result.dijkstraPairs.map((pair, idx) => (
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
                              <React.Fragment key={`dijkstra-${idx}-${nodeId}-${index}`}>
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

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {LABELS.FLOYD} - {LABELS.ALL_SHORTEST_PATHS}
                  </p>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {result.floydPairs.map((pair, idx) => (
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
                              <React.Fragment key={`floyd-${idx}-${nodeId}-${index}`}>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
