import React, { useState, useEffect, useCallback } from "react";
import { Graph, Packet, RoutingTable, TransmissionRecord } from "@/types/graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraphVisualization } from "./GraphVisualization";
import { 
  buildRoutingTables, 
  findVirtualCircuitRoute, 
  findDatagramRoute, 
  findRandomRoute,
  findFloodingRoutes,
  findFixedRoute,
  findAdaptiveRoute,
  findExperienceRoute,
  TransportMethod,
  RoutingAlgorithm
} from "@/lib/routing";
import { Play, Pause, RotateCcw, Table as TableIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LABELS } from "@/constants/labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PacketRoutingProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
}

export const PacketRouting: React.FC<PacketRoutingProps> = ({ graph, onGraphChange }) => {
  const { toast } = useToast();
  const [sourceNodeId, setSourceNodeId] = useState<string>("");
  const [destinationNodeId, setDestinationNodeId] = useState<string>("");
  const [transportMethod, setTransportMethod] = useState<TransportMethod>('virtual-circuit');
  const [routingAlgorithm, setRoutingAlgorithm] = useState<RoutingAlgorithm>('fixed');
  const [numberOfPackets, setNumberOfPackets] = useState<string>("1");
  const [packetSize, setPacketSize] = useState<string>("1024");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [routingTable, setRoutingTable] = useState<RoutingTable>({});
  const [showRoutingTables, setShowRoutingTables] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [transmissionHistory, setTransmissionHistory] = useState<TransmissionRecord[]>([]);
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());

  const packetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Build routing tables when graph changes
  useEffect(() => {
    const tables = buildRoutingTables(graph);
    setRoutingTable(tables);
  }, [graph]);

  const getNodeLabel = (nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    return node?.label || nodeId;
  };

  const handleStartTransmission = () => {
    if (!sourceNodeId || !destinationNodeId) {
      toast({
        title: LABELS.ERROR,
        description: "Please select source and destination nodes",
        variant: "destructive",
      });
      return;
    }

    if (sourceNodeId === destinationNodeId) {
      toast({
        title: LABELS.ERROR,
        description: "Source and destination must be different",
        variant: "destructive",
      });
      return;
    }

    const size = parseInt(packetSize);
    if (isNaN(size) || size <= 0) {
      toast({
        title: LABELS.ERROR,
        description: "Invalid packet size",
        variant: "destructive",
      });
      return;
    }

    const numPackets = parseInt(numberOfPackets);
    if (isNaN(numPackets) || numPackets <= 0) {
      toast({
        title: LABELS.ERROR,
        description: "Invalid number of packets",
        variant: "destructive",
      });
      return;
    }

    // Find route based on transport method and routing algorithm
    let routes: string[][] = [];
    let route: string[] = [];
    
    // First determine route based on routing algorithm
    switch (routingAlgorithm) {
      case 'random':
        route = findRandomRoute(graph, sourceNodeId, destinationNodeId);
        break;
      case 'flooding':
        routes = findFloodingRoutes(graph, sourceNodeId, destinationNodeId);
        break;
      case 'fixed':
        route = findFixedRoute(graph, sourceNodeId, destinationNodeId);
        break;
      case 'adaptive':
        route = findAdaptiveRoute(graph, routingTable, sourceNodeId, destinationNodeId);
        break;
      case 'experience':
        route = findExperienceRoute(routingTable, sourceNodeId, destinationNodeId);
        break;
    }

    // Apply transport method
    if (routingAlgorithm !== 'flooding' && route.length > 0) {
      if (transportMethod === 'virtual-circuit') {
        route = findVirtualCircuitRoute(graph, sourceNodeId, destinationNodeId);
      } else {
        route = findDatagramRoute(routingTable, sourceNodeId, destinationNodeId);
      }
    }

    // For flooding, create multiple packets across different routes
    if (routingAlgorithm === 'flooding' && routes.length > 0) {
      const newPackets = routes.slice(0, Math.min(numPackets, routes.length)).map((r, idx) => ({
        id: `packet-${Date.now()}-${idx}`,
        number: packets.length + idx + 1,
        sourceId: sourceNodeId,
        destinationId: destinationNodeId,
        size,
        currentNodeId: sourceNodeId,
        route: r,
        routeIndex: 0,
        status: 'waiting' as const,
        color: packetColors[idx % packetColors.length],
        progress: 0,
        startTime: Date.now(),
      }));
      setPackets(newPackets);
      setCurrentPath(routes[0]);
      setIsAnimating(true);
    } else {
      if (route.length === 0) {
        toast({
          title: LABELS.ERROR,
          description: "No route found between selected nodes",
          variant: "destructive",
        });
        return;
      }

      // Create multiple packets on the same route
      const newPackets = Array.from({ length: numPackets }, (_, idx) => ({
        id: `packet-${Date.now()}-${idx}`,
        number: packets.length + idx + 1,
        sourceId: sourceNodeId,
        destinationId: destinationNodeId,
        size,
        currentNodeId: sourceNodeId,
        route,
        routeIndex: 0,
        status: 'waiting' as const,
        color: packetColors[(packets.length + idx) % packetColors.length],
        progress: 0,
        startTime: Date.now() + idx * 500, // Stagger packets
      }));

      setPackets(newPackets);
      setCurrentPath(route);
      setIsAnimating(true);
    }

    toast({
      title: "Transmission Started",
      description: `Using ${transportMethod} transport with ${routingAlgorithm} routing`,
    });
  };

  // Animation loop - smooth progression along edges
  useEffect(() => {
    if (!isAnimating || packets.length === 0) return;

    const interval = setInterval(() => {
      setPackets(prevPackets => {
        const updatedPackets = prevPackets.map(packet => {
          if (packet.status === 'delivered') return packet;
          
          // Only start animating if startTime has passed
          if (Date.now() < packet.startTime) return packet;

          const newProgress = packet.progress + 0.1; // Increment progress

          if (newProgress >= 1) {
            // Reached next node
            const nextIndex = packet.routeIndex + 1;
            if (nextIndex >= packet.route.length) {
              const endTime = Date.now();
              const duration = ((endTime - packet.startTime) / 1000).toFixed(1);
              
              // Add to transmission history
              setTransmissionHistory(prev => [...prev, {
                packetNumber: packet.number,
                path: packet.route.map(id => getNodeLabel(id)).join(' → '),
                size: packet.size,
                startTime: packet.startTime,
                endTime,
                duration: `${duration}s`,
              }]);

              return { ...packet, status: 'delivered' as const, endTime, progress: 1 };
            }

            return {
              ...packet,
              currentNodeId: packet.route[nextIndex],
              routeIndex: nextIndex,
              status: 'transmitting' as const,
              progress: 0,
            };
          }

          return {
            ...packet,
            progress: newProgress,
            status: 'transmitting' as const,
          };
        });

        // Check if all packets are delivered
        const allDelivered = updatedPackets.every(p => p.status === 'delivered');
        if (allDelivered) {
          setIsAnimating(false);
          toast({
            title: "Transmission Complete",
            description: "All packets have been delivered",
          });
        }

        // Update highlighted edges based on packet positions
        const edges = new Set<string>();
        updatedPackets.forEach(packet => {
          if (packet.status === 'transmitting' && packet.routeIndex < packet.route.length - 1) {
            const from = packet.route[packet.routeIndex];
            const to = packet.route[packet.routeIndex + 1];
            edges.add(`${from}-${to}`);
            edges.add(`${to}-${from}`);
          }
        });
        setHighlightedEdges(edges);

        return updatedPackets;
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isAnimating, packets.length, toast]);

  const handlePause = () => {
    setIsAnimating(false);
  };

  const handleResume = () => {
    if (packets.some(p => p.status !== 'delivered')) {
      setIsAnimating(true);
    }
  };

  const handleReset = () => {
    setPackets([]);
    setIsAnimating(false);
    setCurrentPath([]);
    setHighlightedEdges(new Set());
    setTransmissionHistory([]);
  };

  const getPacketPosition = (packet: Packet): { x: number; y: number } => {
    if (packet.routeIndex >= packet.route.length - 1) {
      const node = graph.nodes.find(n => n.id === packet.currentNodeId);
      return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
    }

    const fromNode = graph.nodes.find(n => n.id === packet.route[packet.routeIndex]);
    const toNode = graph.nodes.find(n => n.id === packet.route[packet.routeIndex + 1]);

    if (!fromNode || !toNode) return { x: 0, y: 0 };

    // Interpolate position along edge
    const x = fromNode.x + (toNode.x - fromNode.x) * packet.progress;
    const y = fromNode.y + (toNode.y - fromNode.y) * packet.progress;

    return { x, y };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>{LABELS.PACKET_ROUTING_CONTROLS}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Transport Method</Label>
              <Select value={transportMethod} onValueChange={(v) => setTransportMethod(v as TransportMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual-circuit">Virtual Circuit</SelectItem>
                  <SelectItem value="datagram">Datagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{LABELS.ROUTING_METHOD}</Label>
              <Select value={routingAlgorithm} onValueChange={(v) => setRoutingAlgorithm(v as RoutingAlgorithm)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Routing</SelectItem>
                  <SelectItem value="random">Random Routing</SelectItem>
                  <SelectItem value="flooding">Flooding Routing</SelectItem>
                  <SelectItem value="adaptive">Adaptive Routing</SelectItem>
                  <SelectItem value="experience">Experience-Based Routing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{LABELS.SOURCE_NODE}</Label>
              <Select value={sourceNodeId} onValueChange={setSourceNodeId}>
                <SelectTrigger>
                  <SelectValue placeholder={LABELS.SELECT_SOURCE} />
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

            <div className="space-y-2">
              <Label>{LABELS.DESTINATION_NODE}</Label>
              <Select value={destinationNodeId} onValueChange={setDestinationNodeId}>
                <SelectTrigger>
                  <SelectValue placeholder={LABELS.SELECT_DESTINATION} />
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

            <div className="space-y-2">
              <Label>Number of Packets</Label>
              <Input
                type="number"
                value={numberOfPackets}
                onChange={(e) => setNumberOfPackets(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>{LABELS.PACKET_SIZE}</Label>
              <Input
                type="number"
                value={packetSize}
                onChange={(e) => setPacketSize(e.target.value)}
                placeholder="Bytes"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleStartTransmission} disabled={isAnimating} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                {LABELS.START_TRANSMISSION}
              </Button>
              {isAnimating ? (
                <Button onClick={handlePause} variant="secondary">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : packets.length > 0 && packets.some(p => p.status !== 'delivered') ? (
                <Button onClick={handleResume} variant="secondary">
                  <Play className="w-4 h-4" />
                </Button>
              ) : null}
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              onClick={() => setShowRoutingTables(!showRoutingTables)} 
              variant="outline" 
              className="w-full"
            >
              <TableIcon className="w-4 h-4 mr-2" />
              {showRoutingTables ? LABELS.HIDE_ROUTING_TABLES : LABELS.SHOW_ROUTING_TABLES}
            </Button>
          </CardContent>
        </Card>

        {/* Packet Information */}
        <Card>
          <CardHeader>
            <CardTitle>{LABELS.PACKET_INFORMATION}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {packets.length === 0 ? (
                <p className="text-muted-foreground text-sm">{LABELS.NO_PACKETS}</p>
              ) : (
                <div className="space-y-3">
                  {packets.map(packet => (
                    <Card key={packet.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {LABELS.PACKET} #{packet.number}
                          </span>
                          <Badge variant={
                            packet.status === 'delivered' ? 'default' :
                            packet.status === 'transmitting' ? 'secondary' : 'outline'
                          }>
                            {packet.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div><strong>{LABELS.SOURCE}:</strong> {getNodeLabel(packet.sourceId)}</div>
                          <div><strong>{LABELS.DESTINATION}:</strong> {getNodeLabel(packet.destinationId)}</div>
                          <div><strong>{LABELS.CURRENT_NODE}:</strong> {getNodeLabel(packet.currentNodeId)}</div>
                          <div><strong>{LABELS.SIZE}:</strong> {packet.size} bytes</div>
                          <div>
                            <strong>{LABELS.ROUTE}:</strong>{" "}
                            {packet.route.map(getNodeLabel).join(" → ")}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>{LABELS.NETWORK_VISUALIZATION}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <svg width="600" height="400" className="border border-border rounded-lg bg-background">
              {/* Render edges */}
              {graph.edges.map(edge => {
                const sourceNode = graph.nodes.find(n => n.id === edge.source);
                const targetNode = graph.nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const edgeKey1 = `${edge.source}-${edge.target}`;
                const edgeKey2 = `${edge.target}-${edge.source}`;
                const isHighlighted = highlightedEdges.has(edgeKey1) || highlightedEdges.has(edgeKey2);

                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                    strokeWidth={isHighlighted ? 3 : 2}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Render nodes */}
              {graph.nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={20}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-sm font-semibold fill-foreground"
                  >
                    {node.label}
                  </text>
                </g>
              ))}

              {/* Render packets */}
              {packets.map(packet => {
                const pos = getPacketPosition(packet);
                return (
                  <circle
                    key={packet.id}
                    cx={pos.x}
                    cy={pos.y}
                    r={8}
                    fill={packet.color}
                    stroke="white"
                    strokeWidth={2}
                    className="transition-all duration-100"
                  />
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Transmission History */}
      {transmissionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transmission History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Packet #</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Size (bytes)</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transmissionHistory.map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{record.packetNumber}</TableCell>
                      <TableCell className="max-w-md truncate">{record.path}</TableCell>
                      <TableCell>{record.size}</TableCell>
                      <TableCell>{record.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Routing Tables */}
      {showRoutingTables && (
        <Card>
          <CardHeader>
            <CardTitle>{LABELS.ROUTING_TABLES}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {graph.nodes.map(node => (
                  <Card key={node.id} className="p-4">
                    <h4 className="font-semibold mb-2">
                      {LABELS.NODE} {node.label}
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{LABELS.DESTINATION}</TableHead>
                            <TableHead>{LABELS.NEXT_HOP}</TableHead>
                            <TableHead>{LABELS.DISTANCE}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {routingTable[node.id]?.map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{getNodeLabel(entry.destination)}</TableCell>
                              <TableCell>{getNodeLabel(entry.nextHop)}</TableCell>
                              <TableCell>{entry.distance}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
