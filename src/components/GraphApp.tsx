import React, { useState, useRef } from "react";
import { Graph, Node, Edge } from "@/types/graph";
import { GraphVisualization } from "./GraphVisualization";
import { IncidenceMatrix } from "./IncidenceMatrix";
import { PathFinder } from "./PathFinder";
import { AlgorithmComparison } from "./AlgorithmComparison";
import { PacketRouting } from "./PacketRouting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network, Grid3X3, Calculator, Plus, Trash2, Edit, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LABELS } from "@/constants/labels";

export const GraphApp: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [edgeWeight, setEdgeWeight] = useState<string>("1");
  const [comparisonGraph, setComparisonGraph] = useState<Graph | null>(null);
  const [nodeCount, setNodeCount] = useState<string>("10");
  const [showComparison, setShowComparison] = useState(false);

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

  const getSelectedNodesLabels = () => {
    return selectedNodes.map(nodeId => {
      const node = graph.nodes.find(n => n.id === nodeId);
      return node ? node.label : nodeId;
    });
  };

  const getExistingEdge = () => {
    if (selectedNodes.length !== 2) return null;
    return graph.edges.find(edge => 
      (edge.source === selectedNodes[0] && edge.target === selectedNodes[1])
    );
  };

  const getReversedExistingEdge = () => {
    if (selectedNodes.length !== 2) return null;
    return graph.edges.find(edge => 
      (edge.source === selectedNodes[1] && edge.target === selectedNodes[1])
    );
  };

  const handleAddEdge = () => {
    if (selectedNodes.length !== 2) return;
    
    const weight = parseFloat(edgeWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Неверное значение веса",
        description: "Пожалуйста, введите число больше 0.",
        variant: "destructive",
      });
      return;
    }

    const existingEdge = getExistingEdge();
    if (existingEdge) {
      toast({
        title: "Дуга уже существует",
        variant: "destructive",
      });
      return;
    }

    const newEdge = {
      id: `edge-${Date.now()}`,
      source: selectedNodes[0],
      target: selectedNodes[1],
      weight: weight,
    };

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));

    toast({
      title: "Edge Added",
      description: `Added edge between ${getSelectedNodesLabels().join(" and ")} with weight ${weight}.`,
    });
  };

  const handleDeleteEdge = () => {
    if (selectedNodes.length !== 2) return;
    
    const existingEdge = getExistingEdge();
    if (!existingEdge) {
      toast({
        title: "No Edge Found",
        description: "No edge exists between the selected nodes.",
        variant: "destructive",
      });
      return;
    }

    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== existingEdge.id),
    }));

    toast({
      title: "Дуга удалена",
      description: `Удалена дуга между ${getSelectedNodesLabels().join(" и ")}.`,
    });
  };

  const handleChangeWeight = () => {
    if (selectedNodes.length !== 2) return;
    
    const weight = parseFloat(edgeWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Неверное значение веса",
        description: "Пожалуйста, введите число больше 0.",
        variant: "destructive",
      });
      return;
    }

    const existingEdge = getExistingEdge();
    if (!existingEdge) {
      toast({
        title: "Дуга не найдена",
        variant: "destructive",
      });
      return;
    }

    setGraph(prev => ({
      ...prev,
      edges: prev.edges.map(edge => 
        edge.id === existingEdge.id 
          ? { ...edge, weight: weight }
          : edge
      ),
    }));

    toast({
      title: "Вес изменен",
      description: `Изменен вес между ${getSelectedNodesLabels().join(" и ")} на ${weight}.`,
    });
  };

  const handleExportGraph = () => {
    let content = "Nodes:\n";
    graph.nodes.forEach(node => {
      content += `${node.label} ${node.x} ${node.y}\n`;
    });
    
    content += "\nEdges:\n";
    graph.edges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        content += `${sourceNode.label} ${targetNode.label} ${edge.weight}\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: LABELS.EXPORT_SUCCESS,
      description: `Экспортировано ${graph.nodes.length} вершин и ${graph.edges.length} дуг.`,
    });
  };

  const handleImportGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        let section: 'nodes' | 'edges' | null = null;

        for (const line of lines) {
          if (line.toLowerCase() === 'nodes:') {
            section = 'nodes';
            continue;
          }
          if (line.toLowerCase() === 'edges:') {
            section = 'edges';
            continue;
          }

          if (section === 'nodes') {
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
              const [label, x, y] = parts;
              nodes.push({
                id: `node-${Date.now()}-${nodes.length}`,
                x: parseFloat(x),
                y: parseFloat(y),
                label: label,
              });
            }
          } else if (section === 'edges') {
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
              const [sourceLabel, targetLabel, weight] = parts;
              const sourceNode = nodes.find(n => n.label === sourceLabel);
              const targetNode = nodes.find(n => n.label === targetLabel);
              
              if (sourceNode && targetNode) {
                edges.push({
                  id: `edge-${Date.now()}-${edges.length}`,
                  source: sourceNode.id,
                  target: targetNode.id,
                  weight: parseFloat(weight),
                });
              }
            }
          }
        }

        if (nodes.length > 0) {
          setGraph({ nodes, edges });
          toast({
            title: LABELS.IMPORT_SUCCESS,
            description: `Импортировано ${nodes.length} вершин и ${edges.length} дуг.`,
          });
        } else {
          throw new Error('No nodes found');
        }
      } catch (error) {
        toast({
          title: LABELS.IMPORT_ERROR,
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateRandomGraph = () => {
    const count = parseInt(nodeCount);
    if (isNaN(count) || count < 2 || count > 50) {
      toast({
        title: "Неверное значение",
        description: "Введите число от 2 до 50",
        variant: "destructive",
      });
      return null;
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Generate nodes in circular layout
    const centerX = 300;
    const centerY = 200;
    const radius = 150;
    
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      nodes.push({
        id: `random-node-${i}`,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : ''),
      });
    }

    // Generate random edges
    const edgeCount = Math.floor(count * 1.5);
    const edgeSet = new Set<string>();
    
    for (let i = 0; i < edgeCount; i++) {
      let source = Math.floor(Math.random() * count);
      let target = Math.floor(Math.random() * count);
      
      while (source === target || edgeSet.has(`${source}-${target}`)) {
        source = Math.floor(Math.random() * count);
        target = Math.floor(Math.random() * count);
      }
      
      edgeSet.add(`${source}-${target}`);
      edges.push({
        id: `random-edge-${i}`,
        source: `random-node-${source}`,
        target: `random-node-${target}`,
        weight: Math.floor(Math.random() * 20) + 1,
      });
    }
    
    return { nodes, edges };
  };

  const handleCompareUserGraph = () => {
    setComparisonGraph(graph);
    setShowComparison(true);
  };

  const handleCompareRandomGraph = () => {
    const randomGraph = generateRandomGraph();
    if (randomGraph) {
      setComparisonGraph(randomGraph);
      setShowComparison(true);
      toast({
        title: LABELS.GENERATE_GRAPH,
        description: `${randomGraph.nodes.length} ${LABELS.NODES_GENERATED}, ${randomGraph.edges.length} ${LABELS.EDGES_GENERATED}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {LABELS.APP_TITLE}
          </h1>
          <p className="text-lg text-muted-foreground">
            {LABELS.APP_SUBTITLE}
          </p>
          <div className="flex justify-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleImportGraph}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {LABELS.IMPORT_GRAPH}
            </Button>
            <Button onClick={handleExportGraph} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {LABELS.EXPORT_GRAPH}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto">
            <TabsTrigger value="editor">{LABELS.TAB_EDITOR}</TabsTrigger>
            <TabsTrigger value="visualization">{LABELS.TAB_VISUALIZATION}</TabsTrigger>
            <TabsTrigger value="routing">{LABELS.PACKET_ROUTING}</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader>
                <p className="text-sm text-muted-foreground">
                  {LABELS.GRAPH_INSTRUCTIONS}
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
            {/* Edge Controls */}
            {selectedNodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    {LABELS.EDGE_CONTROLS}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedNodes.length === 2 
                      ? `${LABELS.SELECTED} ${getSelectedNodesLabels().join(" -> ")}` 
                      : `${LABELS.SELECTED} ${getSelectedNodesLabels().join(", ")} ${LABELS.SELECT_TWO_NODES}`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edge-weight">{LABELS.WEIGHT}</Label>
                    <Input
                      id="edge-weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={edgeWeight}
                      onChange={(e) => setEdgeWeight(e.target.value)}
                      placeholder={LABELS.ENTER_WEIGHT}
                    />
                  </div>
                  
                  {selectedNodes.length === 2 && (
                    <div className="grid grid-cols-1 gap-2">
                      {!getExistingEdge() ? (
                        <Button onClick={handleAddEdge} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          {LABELS.ADD_EDGE}
                        </Button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={handleChangeWeight} variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            {LABELS.CHANGE_WEIGHT}
                          </Button>
                          <Button onClick={handleDeleteEdge} variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {LABELS.DELETE_EDGE}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <PathFinder
              graph={graph}
              onPathHighlight={setHighlightedPath}
            />
          </div>
        </div>

            {/* Incidence Matrix */}
            <Card>
          <CardContent>
            <div className="h-80">
              <IncidenceMatrix
                graph={graph}
                onGraphChange={setGraph}
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{LABELS.COMPARISON_CONTROLS}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="node-count">{LABELS.NUMBER_OF_NODES}</Label>
                  <Input
                    id="node-count"
                    type="number"
                    min="2"
                    max="50"
                    value={nodeCount}
                    onChange={(e) => setNodeCount(e.target.value)}
                    placeholder={LABELS.NUMBER_OF_NODES}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleCompareUserGraph} className="w-full">
                    {LABELS.COMPARE_USER_GRAPH}
                  </Button>
                  <Button onClick={handleCompareRandomGraph} className="w-full" variant="secondary">
                    {LABELS.COMPARE_RANDOM_GRAPH}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showComparison && comparisonGraph && (
              <AlgorithmComparison 
                graph={comparisonGraph} 
                onRun={() => setShowComparison(true)}
              />
            )}
          </TabsContent>

          <TabsContent value="routing" className="space-y-4">
            <PacketRouting graph={graph} onGraphChange={setGraph} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};