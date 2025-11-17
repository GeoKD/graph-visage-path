import React, { useState, useEffect, useCallback } from "react";
import { Graph, Packet, RoutingTable } from "@/types/graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraphVisualization } from "./GraphVisualization";
import { buildRoutingTables, findVirtualCircuitRoute, findDatagramRoute, RoutingMethod } from "@/lib/routing";
import { Play, Pause, RotateCcw, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LABELS } from "@/constants/labels";

interface PacketRoutingProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
}

export const PacketRouting: React.FC<PacketRoutingProps> = ({ graph, onGraphChange }) => {
  const { toast } = useToast();
  const [sourceNodeId, setSourceNodeId] = useState<string>("");
  const [destinationNodeId, setDestinationNodeId] = useState<string>("");
  const [routingMethod, setRoutingMethod] = useState<RoutingMethod>('virtual-circuit');
  const [packetSize, setPacketSize] = useState<string>("1024");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [routingTable, setRoutingTable] = useState<RoutingTable>({});
  const [showRoutingTables, setShowRoutingTables] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

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

    // Find route based on routing method
    let route: string[] = [];
    if (routingMethod === 'virtual-circuit') {
      route = findVirtualCircuitRoute(graph, sourceNodeId, destinationNodeId);
    } else {
      route = findDatagramRoute(routingTable, sourceNodeId, destinationNodeId);
    }

    if (route.length === 0) {
      toast({
        title: LABELS.ERROR,
        description: "No route found between selected nodes",
        variant: "destructive",
      });
      return;
    }

    // Create a packet
    const newPacket: Packet = {
      id: `packet-${Date.now()}`,
      number: packets.length + 1,
      sourceId: sourceNodeId,
      destinationId: destinationNodeId,
      size,
      currentNodeId: sourceNodeId,
      route,
      routeIndex: 0,
      status: 'waiting',
    };

    setPackets([newPacket]);
    setCurrentPath(route);
    setIsAnimating(true);

    toast({
      title: "Transmission Started",
      description: `Packet #${newPacket.number} using ${routingMethod === 'virtual-circuit' ? 'Virtual Circuit' : 'Datagram'} method`,
    });
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating || packets.length === 0) return;

    const interval = setInterval(() => {
      setPackets(prevPackets => {
        const updatedPackets = prevPackets.map(packet => {
          if (packet.status === 'delivered') return packet;

          const nextIndex = packet.routeIndex + 1;
          if (nextIndex >= packet.route.length) {
            return { ...packet, status: 'delivered' as const };
          }

          return {
            ...packet,
            currentNodeId: packet.route[nextIndex],
            routeIndex: nextIndex,
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

        return updatedPackets;
      });
    }, 1000); // Move every 1 second

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
              <Label>{LABELS.ROUTING_METHOD}</Label>
              <Select value={routingMethod} onValueChange={(v) => setRoutingMethod(v as RoutingMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual-circuit">{LABELS.VIRTUAL_CIRCUIT}</SelectItem>
                  <SelectItem value="datagram">{LABELS.DATAGRAM}</SelectItem>
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
              <Table className="w-4 h-4 mr-2" />
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
            <GraphVisualization
              graph={graph}
              onGraphChange={onGraphChange}
              highlightedPath={currentPath}
            />
            {/* Packet visualization overlay */}
            {packets.map(packet => {
              const node = graph.nodes.find(n => n.id === packet.currentNodeId);
              if (!node) return null;
              return (
                <div
                  key={packet.id}
                  className="absolute w-3 h-3 bg-primary rounded-full animate-pulse"
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 1s ease-in-out',
                  }}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">{LABELS.DESTINATION}</th>
                            <th className="text-left py-2">{LABELS.NEXT_HOP}</th>
                            <th className="text-left py-2">{LABELS.DISTANCE}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {routingTable[node.id]?.map((entry, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="py-2">{getNodeLabel(entry.destination)}</td>
                              <td className="py-2">{getNodeLabel(entry.nextHop)}</td>
                              <td className="py-2">{entry.distance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
