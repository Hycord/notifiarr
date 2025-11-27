'use client';

import React, { useMemo, useState, useCallback, type CSSProperties } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import { InfoIcon } from 'lucide-react';
import type { DataFlowResponse } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DataFlowChartProps {
  data: DataFlowResponse;
}

// Color mappings for each type
const colors = {
  client: { bg: '#3b82f6', border: '#2563eb', layerBg: 'rgba(59, 130, 246, 0.1)' },
  server: { bg: '#8b5cf6', border: '#7c3aed', layerBg: 'rgba(139, 92, 246, 0.1)' },
  event: { bg: '#ec4899', border: '#db2777', layerBg: 'rgba(236, 72, 153, 0.1)' },
  sink: { bg: '#f59e0b', border: '#d97706', layerBg: 'rgba(245, 158, 11, 0.1)' },
};

// Custom node styles - proper block styling
const getNodeStyle = (type: string, enabled: boolean = true, isOrphaned: boolean = false): CSSProperties => {
  const colorSet = colors[type as keyof typeof colors] || colors.client;
  
  let background: string;
  let border: string;
  
  // Disabled always shows red, regardless of orphan status
  if (!enabled) {
    background = '#dc2626'; // Red for disabled
    border = '#b91c1c';
  } else if (isOrphaned) {
    background = '#94a3b8'; // Gray for orphaned
    border = '#64748b';
  } else {
    // Enabled and not orphaned -> always green for easy visualization
    background = '#10b981'; // Green for healthy nodes
    border = '#059669';
  }
  
  return {
    padding: '0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    border: `2px solid ${border}`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    cursor: 'grab',
    background,
    color: 'white',
  };
};

export function DataFlowChart({ data }: DataFlowChartProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const edgeMap = new Map<string, number>();

    // Layout configuration
    const nodeWidth = 200;
    const nodeHeight = 60;
    const nodeSpacing = 30; // Vertical spacing between nodes
    const columnSpacing = 500; // Horizontal spacing between columns
    const layerPadding = 40; // Padding inside layer containers
    const layerHeaderWidth = 50; // Width for layer title

    // Calculate centers for each column based on number of items
    // Show all items, not just enabled ones
    const allClients = data.clients;
    const allServers = data.servers;
    const allEvents = data.events;
    const allSinks = data.sinks;

    // Build a comprehensive connection graph for orphan detection
    // A node is orphaned if:
    // 1. It has no incoming connections, OR
    // 2. All its incoming connections come from disabled nodes, OR
    // 3. All its incoming connections come from orphaned nodes
    
    // Build the connection graph: target -> sources
    interface Connection {
      sourceId: string;
      sourceType: 'client' | 'server' | 'event' | 'sink';
      enabled: boolean;
    }
    
    const incomingConnections = new Map<string, Connection[]>();
    
    // Helper to add a connection
    const addConnection = (targetId: string, sourceId: string, sourceType: Connection['sourceType'], enabled: boolean) => {
      if (!incomingConnections.has(targetId)) {
        incomingConnections.set(targetId, []);
      }
      incomingConnections.get(targetId)!.push({ sourceId, sourceType, enabled });
    };
    
    // Build client-server connections from server.clientIds
    data.servers.forEach((server) => {
      server.clientIds.forEach(clientId => {
        const client = data.clients.find(c => c.id === clientId);
        if (client) {
          // Server receives from Client
          addConnection(
            `server-${server.id}`,
            `client-${clientId}`,
            'client',
            client.enabled && server.enabled
          );
        }
      });
    });

    // Filter routing paths to only show explicitly defined server -> event connections
    // Exclude paths where events use wildcard/empty server matching (appliesToAllServers)
    const filteredRoutingPaths = data.routingPaths.filter((path) => {
      const event = data.events.find(e => e.id === path.eventId);
      // Only include paths where the event has specific server IDs (not wildcard or empty)
      return event && !event.appliesToAllServers && event.serverIds.length > 0;
    });

    // Build server -> event and event -> sink connections from filtered routing paths
    filteredRoutingPaths.forEach((path) => {
      const server = data.servers.find(s => s.id === path.serverId);
      const event = data.events.find(e => e.id === path.eventId);
      
      if (server && event) {
        // Event receives from Server
        addConnection(
          `event-${path.eventId}`,
          `server-${path.serverId}`,
          'server',
          server.enabled && event.enabled
        );
      }
      
      // Sink receives from Event
      path.sinkStatuses.forEach((sink) => {
        if (event) {
          addConnection(
            `sink-${sink.id}`,
            `event-${path.eventId}`,
            'event',
            event.enabled && sink.enabled
          );
        }
      });
    });
    
    // Recursive orphan detection with memoization
    const orphanCache = new Map<string, boolean>();
    
    const isOrphaned = (nodeId: string): boolean => {
      // Check cache first
      if (orphanCache.has(nodeId)) {
        return orphanCache.get(nodeId)!;
      }
      
      // Clients are never orphaned (they are source nodes)
      if (nodeId.startsWith('client-')) {
        orphanCache.set(nodeId, false);
        return false;
      }
      
      const connections = incomingConnections.get(nodeId);
      
      // No incoming connections = orphaned
      if (!connections || connections.length === 0) {
        orphanCache.set(nodeId, true);
        return true;
      }
      
      // Check if there's at least one valid incoming connection:
      // - The connection must be enabled AND
      // - The source node must not be orphaned
      const hasValidConnection = connections.some(conn => {
        // Skip disabled connections
        if (!conn.enabled) return false;
        
        // Check if source is orphaned (recursive check with cycle detection)
        // To prevent infinite recursion, temporarily mark this node as non-orphaned
        orphanCache.set(nodeId, false);
        const sourceIsOrphaned = isOrphaned(conn.sourceId);
        orphanCache.delete(nodeId);
        
        return !sourceIsOrphaned;
      });
      
      const result = !hasValidConnection;
      orphanCache.set(nodeId, result);
      return result;
    };

    const maxItemsInColumn = Math.max(
      allClients.length,
      allServers.length,
      allEvents.length,
      allSinks.length
    );

    const totalHeight = maxItemsInColumn * (nodeHeight + nodeSpacing) - nodeSpacing;
    const centerOffset = totalHeight / 2;

    // Helper to calculate centered positions
    const getCenteredY = (index: number, totalItems: number) => {
      const columnHeight = totalItems * (nodeHeight + nodeSpacing) - nodeSpacing;
      const startY = centerOffset - columnHeight / 2;
      return startY + index * (nodeHeight + nodeSpacing);
    };

    let columnIndex = 0;

    // Add layer container for clients FIRST (behind nodes)
    if (allClients.length > 0) {
      const layerHeight = allClients.length * (nodeHeight + nodeSpacing) - nodeSpacing + layerPadding * 2;
      const colorSet = colors.client;
      nodes.push({
        id: 'layer-clients',
        type: 'default',
        data: { label: 'CLIENTS' },
        position: { 
          x: columnIndex * columnSpacing, 
          y: getCenteredY(0, allClients.length) - layerPadding 
        },
        style: {
          width: nodeWidth + layerHeaderWidth + layerPadding,
          height: layerHeight,
          background: colorSet.layerBg,
          border: `2px solid ${colorSet.border}`,
          borderRadius: '12px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: 700,
          color: colorSet.border,
          textAlign: 'center',
          pointerEvents: 'none',
        } as CSSProperties,
        draggable: false,
        selectable: false,
        zIndex: -1,
      });
    }

    // Column 1: Clients
    allClients.forEach((client, i) => {
      const nodeIsOrphaned = isOrphaned(`client-${client.id}`);
      nodes.push({
        id: `client-${client.id}`,
        type: 'default',
        data: { label: client.name },
        position: { 
          x: columnIndex * columnSpacing + layerHeaderWidth, 
          y: getCenteredY(i, allClients.length) 
        },
        style: {
          ...getNodeStyle('client', client.enabled, nodeIsOrphaned),
          padding: '8px',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    columnIndex++;

    // Add layer container for servers
    if (allServers.length > 0) {
      const layerHeight = allServers.length * (nodeHeight + nodeSpacing) - nodeSpacing + layerPadding * 2;
      const colorSet = colors.server;
      nodes.push({
        id: 'layer-servers',
        type: 'default',
        data: { label: 'SERVERS' },
        position: { 
          x: columnIndex * columnSpacing, 
          y: getCenteredY(0, allServers.length) - layerPadding 
        },
        style: {
          width: nodeWidth + layerHeaderWidth + layerPadding,
          height: layerHeight,
          background: colorSet.layerBg,
          border: `2px solid ${colorSet.border}`,
          borderRadius: '12px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: 700,
          color: colorSet.border,
          textAlign: 'center',
          pointerEvents: 'none',
        } as CSSProperties,
        draggable: false,
        selectable: false,
        zIndex: -1,
      });
    }

    // Column 2: Servers
    allServers.forEach((server, i) => {
      const nodeIsOrphaned = isOrphaned(`server-${server.id}`);
      nodes.push({
        id: `server-${server.id}`,
        type: 'default',
        data: { label: server.displayName },
        position: { 
          x: columnIndex * columnSpacing + layerHeaderWidth, 
          y: getCenteredY(i, allServers.length) 
        },
        style: getNodeStyle('server', server.enabled, nodeIsOrphaned),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    columnIndex++;

    // Sort all events by priority (highest first) before grouping
    const sortedEvents = [...allEvents].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Group events by their group property
    const eventGroups = new Map<string, typeof allEvents>();
    const ungroupedEvents: typeof allEvents = [];
    
    sortedEvents.forEach(event => {
      if (event.group) {
        if (!eventGroups.has(event.group)) {
          eventGroups.set(event.group, []);
        }
        eventGroups.get(event.group)!.push(event);
      } else {
        ungroupedEvents.push(event);
      }
    });

    // Build display order with proper priority-based ordering
    const groupHeaderSpacing = 40; // Extra vertical space for group header
    const groupPaddingVertical = 20; // Top/bottom padding inside groups
    
    // Create sortable items that include both individual events and groups
    type SortableItem = 
      | { type: 'event'; event: typeof allEvents[0]; priority: number }
      | { type: 'group'; groupName: string; groupEvents: typeof allEvents; priority: number };
    
    const sortableItems: SortableItem[] = [];
    
    // Add ungrouped events
    ungroupedEvents.forEach(event => {
      sortableItems.push({
        type: 'event',
        event,
        priority: event.priority || 0
      });
    });
    
    // Add groups with their max priority
    Array.from(eventGroups.entries()).forEach(([groupName, groupEvents]) => {
      sortableItems.push({
        type: 'group',
        groupName,
        groupEvents,
        priority: Math.max(...groupEvents.map(e => e.priority || 0))
      });
    });
    
    // Sort all items by priority (highest first)
    sortableItems.sort((a, b) => b.priority - a.priority);
    
    // Build groups list in sorted order for rendering
    const groupsWithPriority = sortableItems
      .filter((item): item is Extract<typeof item, { type: 'group' }> => item.type === 'group')
      .map(item => ({
        groupName: item.groupName,
        groupEvents: item.groupEvents,
        maxPriority: item.priority
      }));
    
    // Build layout items - groups are treated as composite nodes with their own dimensions
    type LayoutItem = 
      | { type: 'event'; event: typeof allEvents[0]; height: number; id: string }
      | { type: 'group'; groupName: string; groupEvents: typeof allEvents; height: number; id: string };
    
    const groupInternalPadding = 30; // Padding inside groups (top and bottom)
    const groupHeaderHeight = 40; // Height allocated for group header/label
    
    const layoutItems: LayoutItem[] = [];
    
    sortableItems.forEach(item => {
      if (item.type === 'event') {
        layoutItems.push({
          type: 'event',
          event: item.event,
          height: nodeHeight,
          id: item.event.id
        });
      } else {
        // Calculate group height: header + all events + spacing between events + bottom padding
        const eventCount = item.groupEvents.length;
        const eventsHeight = eventCount * nodeHeight + (eventCount - 1) * nodeSpacing;
        const totalGroupHeight = groupHeaderHeight + eventsHeight + groupInternalPadding;
        
        layoutItems.push({
          type: 'group',
          groupName: item.groupName,
          groupEvents: item.groupEvents,
          height: totalGroupHeight,
          id: `group-${item.groupName}`
        });
      }
    });
    
    // Calculate positions - simple linear layout with consistent spacing
    let currentY = 0;
    const itemPositions = new Map<string, { y: number; height: number }>();
    
    layoutItems.forEach((item, index) => {
      itemPositions.set(item.id, { y: currentY, height: item.height });
      
      // Advance to next item position
      currentY += item.height;
      
      // Add spacing after this item (unless it's the last)
      if (index < layoutItems.length - 1) {
        currentY += nodeSpacing;
      }
    });
    
    const totalContentHeight = currentY;
    const eventsCenterOffset = totalContentHeight / 2;
    
    // Helper to get absolute Y position from relative position
    const getAbsoluteY = (relativeY: number) => {
      return -eventsCenterOffset + relativeY + getCenteredY(0, 1);
    };

    // Add layer container for events
    if (allEvents.length > 0) {
      const layerHeight = totalContentHeight + layerPadding * 2;
      const colorSet = colors.event;
      nodes.push({
        id: 'layer-events',
        type: 'default',
        data: { label: 'EVENTS' },
        position: { 
          x: columnIndex * columnSpacing, 
          y: getAbsoluteY(0) - layerPadding 
        },
        style: {
          width: nodeWidth + layerHeaderWidth + layerPadding,
          height: layerHeight,
          background: colorSet.layerBg,
          border: `2px solid ${colorSet.border}`,
          borderRadius: '12px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: 700,
          color: colorSet.border,
          textAlign: 'center',
          pointerEvents: 'none',
        } as CSSProperties,
        draggable: false,
        selectable: false,
        zIndex: -1,
      });
    }

    // Column 3: Render events and groups
    const colorSet = colors.event;
    const groupHorizontalPadding = layerPadding / 2;
    
    layoutItems.forEach((layoutItem) => {
      const itemPos = itemPositions.get(layoutItem.id)!;
      const itemY = getAbsoluteY(itemPos.y);
      
      if (layoutItem.type === 'event') {
        // Render single event
        const nodeIsOrphaned = isOrphaned(`event-${layoutItem.event.id}`);
        nodes.push({
          id: `event-${layoutItem.event.id}`,
          type: 'default',
          data: { label: layoutItem.event.name },
          position: { 
            x: columnIndex * columnSpacing + layerHeaderWidth, 
            y: itemY 
          },
          style: getNodeStyle('event', layoutItem.event.enabled, nodeIsOrphaned),
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          width: nodeWidth,
          height: nodeHeight,
        });
      } else {
        // Render group container
        nodes.push({
          id: `event-group-${layoutItem.groupName}`,
          type: 'default',
          data: { label: layoutItem.groupName.toUpperCase() },
          position: { 
            x: columnIndex * columnSpacing + groupHorizontalPadding, 
            y: itemY
          },
          style: {
            width: nodeWidth + layerHeaderWidth + layerPadding - (groupHorizontalPadding * 2),
            height: layoutItem.height,
            background: 'rgba(16, 185, 129, 0.1)',
            border: `2px dashed ${colorSet.border}`,
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
            fontWeight: 700,
            color: colorSet.border,
            textAlign: 'center',
            pointerEvents: 'none',
          } as CSSProperties,
          draggable: false,
          selectable: false,
          zIndex: 0,
        });
        
        // Render events within the group
        let eventY = itemY + groupHeaderHeight;
        layoutItem.groupEvents.forEach((event, idx) => {
          const nodeIsOrphaned = isOrphaned(`event-${event.id}`);
          nodes.push({
            id: `event-${event.id}`,
            type: 'default',
            data: { label: event.name },
            position: { 
              x: columnIndex * columnSpacing + layerHeaderWidth, 
              y: eventY 
            },
            style: {
              ...getNodeStyle('event', event.enabled, nodeIsOrphaned),
              zIndex: 1,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            width: nodeWidth,
            height: nodeHeight,
          });
          
          // Advance to next event position
          eventY += nodeHeight;
          if (idx < layoutItem.groupEvents.length - 1) {
            eventY += nodeSpacing;
          }
        });
      }
    });

    columnIndex++;

    // Add layer container for sinks
    if (allSinks.length > 0) {
      const layerHeight = allSinks.length * (nodeHeight + nodeSpacing) - nodeSpacing + layerPadding * 2;
      const colorSet = colors.sink;
      nodes.push({
        id: 'layer-sinks',
        type: 'default',
        data: { label: 'SINKS' },
        position: { 
          x: columnIndex * columnSpacing, 
          y: getCenteredY(0, allSinks.length) - layerPadding 
        },
        style: {
          width: nodeWidth + layerHeaderWidth + layerPadding,
          height: layerHeight,
          background: colorSet.layerBg,
          border: `2px solid ${colorSet.border}`,
          borderRadius: '12px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: 700,
          color: colorSet.border,
          textAlign: 'center',
          pointerEvents: 'none',
        } as CSSProperties,
        draggable: false,
        selectable: false,
        zIndex: -1,
      });
    }

    // Column 4: Sinks
    allSinks.forEach((sink, i) => {
      const nodeIsOrphaned = isOrphaned(`sink-${sink.id}`);
      nodes.push({
        id: `sink-${sink.id}`,
        type: 'default',
        data: { label: sink.name },
        position: { 
          x: columnIndex * columnSpacing + layerHeaderWidth, 
          y: getCenteredY(i, allSinks.length) 
        },
        style: getNodeStyle('sink', sink.enabled, nodeIsOrphaned),
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    // Create edges from multiple sources
    // For each edge, track which specific routing paths use it and whether those paths are enabled
    interface EdgePathInfo {
      pathId: string;
      enabled: boolean;
      clientEnabled: boolean;
      serverEnabled: boolean;
      eventEnabled: boolean;
      sinkEnabled: boolean;
    }
    
    const edgePathsMap = new Map<string, EdgePathInfo[]>();
    
    // Create Client -> Server edges from server.clientIds
    data.servers.forEach((server) => {
      const serverNode = data.servers.find(s => s.id === server.id);
      if (!serverNode) return;
      
      server.clientIds.forEach(clientId => {
        const clientNode = data.clients.find(c => c.id === clientId);
        if (!clientNode) return;
        
        const clientServerKey = `client-${clientId}→server-${server.id}`;
        
        // Create a synthetic path info for this connection
        const pathInfo: EdgePathInfo = {
          pathId: `client-server-${clientId}-${server.id}`,
          enabled: clientNode.enabled && serverNode.enabled,
          clientEnabled: clientNode.enabled,
          serverEnabled: serverNode.enabled,
          eventEnabled: true,
          sinkEnabled: true,
        };
        
        if (!edgePathsMap.has(clientServerKey)) edgePathsMap.set(clientServerKey, []);
        edgePathsMap.get(clientServerKey)!.push(pathInfo);
        edgeMap.set(clientServerKey, (edgeMap.get(clientServerKey) || 0) + 1);
      });
    });
    
    // Use the filtered routing paths for server -> event and event -> sink connections
    filteredRoutingPaths.forEach((path, pathIndex) => {
      const pathInfo: EdgePathInfo = {
        pathId: `path-${pathIndex}`,
        enabled: path.enabled,
        clientEnabled: path.clientEnabled,
        serverEnabled: path.serverEnabled,
        eventEnabled: path.eventEnabled,
        sinkEnabled: true, // Will be updated per sink
      };

      // Server -> Event edge
      const serverEventKey = `server-${path.serverId}→event-${path.eventId}`;
      if (!edgePathsMap.has(serverEventKey)) edgePathsMap.set(serverEventKey, []);
      edgePathsMap.get(serverEventKey)!.push({
        ...pathInfo,
        // This edge is disabled if server OR event is disabled
        enabled: path.serverEnabled && path.eventEnabled,
      });
      edgeMap.set(serverEventKey, (edgeMap.get(serverEventKey) || 0) + 1);

      // Event -> Sink edges (one per sink)
      path.sinkStatuses.forEach((sink) => {
        const eventSinkKey = `event-${path.eventId}→sink-${sink.id}`;
        if (!edgePathsMap.has(eventSinkKey)) edgePathsMap.set(eventSinkKey, []);
        edgePathsMap.get(eventSinkKey)!.push({
          ...pathInfo,
          sinkEnabled: sink.enabled,
          // This edge is disabled if event OR sink is disabled
          enabled: path.eventEnabled && sink.enabled,
        });
        edgeMap.set(eventSinkKey, (edgeMap.get(eventSinkKey) || 0) + 1);
      });
    });

    // Determine arrow head colors - red only if ALL incoming edges to target are disabled
    const targetNodeIncomingEnabled = new Map<string, boolean>();
    Array.from(edgePathsMap.entries()).forEach(([key, pathInfos]) => {
      const [, target] = key.split('→');
      const hasEnabledPath = pathInfos.some(info => info.enabled);
      
      // Track if this target has ANY enabled incoming edge
      if (!targetNodeIncomingEnabled.has(target)) {
        targetNodeIncomingEnabled.set(target, false);
      }
      if (hasEnabledPath) {
        targetNodeIncomingEnabled.set(target, true);
      }
    });
    
    // Convert edge map to React Flow edges
    Array.from(edgeMap.entries()).forEach(([key, value]) => {
      const [source, target] = key.split('→');
      const pathInfos = edgePathsMap.get(key) || [];
      
      // Determine edge color based on SOURCE node state:
      // - Red if source is disabled
      // - Green if source is enabled and not orphaned
      // - Gray if source is orphaned
      const sourceIsOrphaned = isOrphaned(source);
      const sourceIsEnabled = pathInfos.length > 0 && pathInfos.some(info => {
        // Check if the source component in this path is enabled
        if (source.startsWith('client-')) return info.clientEnabled;
        if (source.startsWith('server-')) return info.serverEnabled;
        if (source.startsWith('event-')) return info.eventEnabled;
        if (source.startsWith('sink-')) return info.sinkEnabled;
        return false;
      });
      
      let strokeColor: string;
      let arrowColor: string;
      
      if (!sourceIsEnabled) {
        // Source is disabled -> red
        strokeColor = '#dc2626';
        arrowColor = '#dc2626';
      } else if (sourceIsOrphaned) {
        // Source is enabled but orphaned -> gray
        strokeColor = '#64748b';
        arrowColor = '#64748b';
      } else {
        // Source is enabled and not orphaned -> green
        strokeColor = '#10b981';
        arrowColor = '#10b981';
      }
      
      edges.push({
        id: key,
        source,
        target,
        type: 'default',
        animated: true,
        style: {
          stroke: strokeColor,
          strokeWidth: 2, // Consistent thickness for all edges
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: arrowColor,
        },
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click to highlight chains
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('layer-')) {
      // Clicking on a layer group deselects
      setSelectedNode(null);
      setHighlightedEdges(new Set());
      setHighlightedNodes(new Set());
      return;
    }
    
    if (selectedNode === node.id) {
      // Deselect if clicking the same node
      setSelectedNode(null);
      setHighlightedEdges(new Set());
      setHighlightedNodes(new Set());
      return;
    }

    setSelectedNode(node.id);
    
    // Find all complete routing paths that contain this node
    const connectedEdgeIds = new Set<string>();
    const connectedNodeIds = new Set<string>([node.id]);
    
    // Helper to find all paths from a starting node
    const findPaths = (startNode: string, visited: Set<string> = new Set()): string[][] => {
      if (visited.has(startNode)) return [];
      visited.add(startNode);
      
      const paths: string[][] = [[startNode]];
      const outgoingEdges = edges.filter(e => e.source === startNode && !e.source.startsWith('layer-') && !e.target.startsWith('layer-'));
      
      if (outgoingEdges.length === 0) {
        return paths;
      }
      
      const extendedPaths: string[][] = [];
      for (const edge of outgoingEdges) {
        const subPaths = findPaths(edge.target, new Set(visited));
        for (const subPath of subPaths) {
          extendedPaths.push([startNode, ...subPath]);
        }
      }
      
      return extendedPaths.length > 0 ? extendedPaths : paths;
    };
    
    // Find all paths that include the selected node
    // Start from all potential root nodes (clients)
    const allPaths: string[][] = [];
    const clientNodes = nodes.filter(n => n.id.startsWith('client-'));
    
    for (const clientNode of clientNodes) {
      const paths = findPaths(clientNode.id);
      allPaths.push(...paths.filter(path => path.includes(node.id)));
    }
    
    // Extract all nodes and edges from matching paths
    for (const path of allPaths) {
      path.forEach(nodeId => {
        if (!nodeId.startsWith('layer-')) {
          connectedNodeIds.add(nodeId);
        }
      });
      
      // Find edges connecting consecutive nodes in the path
      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(e => e.source === path[i] && e.target === path[i + 1]);
        if (edge) {
          connectedEdgeIds.add(edge.id);
        }
      }
    }
    
    setHighlightedEdges(connectedEdgeIds);
    setHighlightedNodes(connectedNodeIds);
  }, [selectedNode, edges, nodes]);

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightedEdges(new Set());
    setHighlightedNodes(new Set());
  }, []);

  // Handle edge click to deselect
  const onEdgeClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightedEdges(new Set());
    setHighlightedNodes(new Set());
  }, []);

  // Update edge styles based on selection
  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      // Preserve the original stroke color (could be red or gray)
      const originalStroke = edge.style?.stroke || '#64748b';
      
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: highlightedEdges.has(edge.id) ? '#3b82f6' : originalStroke,
          strokeWidth: 2, // Consistent thickness for all edges
          opacity: selectedNode && !highlightedEdges.has(edge.id) ? 0.2 : 1,
        },
        animated: highlightedEdges.has(edge.id),
      };
    });
  }, [edges, highlightedEdges, selectedNode]);

  // Update node styles based on selection
  const styledNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: selectedNode && !highlightedNodes.has(node.id) && !node.id.startsWith('layer-') ? 0.3 : 1,
        boxShadow: highlightedNodes.has(node.id) ? '0 0 0 3px #3b82f6' : node.style?.boxShadow,
      },
    }));
  }, [nodes, highlightedNodes, selectedNode]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data to visualize. Configure clients, servers, events, and sinks to see the flow.
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] sm:h-[600px] lg:h-[800px] border rounded-lg overflow-hidden bg-background relative">
      <style>{`
        .react-flow__handle {
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      
      {/* Info Icon Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-background/95 backdrop-blur-sm shadow-md hover:bg-accent"
            aria-label="Data flow guide"
          >
            <InfoIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Flow Visualization Guide</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-sm">
            {/* Color Legend */}
            <div>
              <h3 className="font-semibold mb-3 text-base">Node Status Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded border-2 border-[#059669] bg-[#10b981]" />
                  <div>
                    <p className="font-medium">Green</p>
                    <p className="text-muted-foreground text-xs">Node is enabled and connected to active data sources</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded border-2 border-[#64748b] bg-[#94a3b8]" />
                  <div>
                    <p className="font-medium">Gray (Orphaned)</p>
                    <p className="text-muted-foreground text-xs">Node is enabled but has no active incoming connections</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded border-2 border-[#b91c1c] bg-[#dc2626]" />
                  <div>
                    <p className="font-medium">Red (Disabled)</p>
                    <p className="text-muted-foreground text-xs">Node is explicitly disabled in configuration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edge Colors */}
            <div>
              <h3 className="font-semibold mb-3 text-base">Connection Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-1 bg-[#10b981]" />
                  <div>
                    <p className="font-medium">Green Edges</p>
                    <p className="text-muted-foreground text-xs">Active connection between enabled nodes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-1 bg-[#94a3b8]" />
                  <div>
                    <p className="font-medium">Gray Edges</p>
                    <p className="text-muted-foreground text-xs">Connection involving at least one disabled node</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow Direction */}
            <div>
              <h3 className="font-semibold mb-3 text-base">How to Trace Data Flow</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Start at Clients</strong> (leftmost column) - These are IRC client connections</li>
                <li><strong className="text-foreground">Flow to Servers</strong> - Clients connect to IRC servers</li>
                <li><strong className="text-foreground">Trigger Events</strong> - Servers match IRC messages to event patterns</li>
                <li><strong className="text-foreground">Send to Sinks</strong> (rightmost column) - Matched events are forwarded to notification endpoints</li>
              </ol>
              <p className="mt-3 text-muted-foreground">Click any node to highlight its connections and see the complete path.</p>
            </div>

            {/* Common Problems */}
            <div>
              <h3 className="font-semibold mb-3 text-base">Common Problems</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">🔴 Red Nodes</p>
                  <p className="text-muted-foreground">Enable the node in its configuration page to activate it.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">⚪ Gray (Orphaned) Nodes</p>
                  <p className="text-muted-foreground">Check that:</p>
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs space-y-1">
                    <li>All upstream nodes are enabled (green)</li>
                    <li>Server has clients assigned (for servers)</li>
                    <li>Event has specific server IDs configured (for events)</li>
                    <li>Event is assigned to sinks via routing rules (for sinks)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">❌ Missing Connections</p>
                  <p className="text-muted-foreground">Events using wildcard server matching (empty/all servers) don't show explicit connections. Configure specific server IDs to see routing paths.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">🔍 No Data Flowing</p>
                  <p className="text-muted-foreground">Ensure the entire chain is green: Client → Server → Event → Sink. Any red or orphaned node breaks the flow.</p>
                </div>
              </div>
            </div>

            {/* Interaction Tips */}
            <div>
              <h3 className="font-semibold mb-3 text-base">Interaction Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Click a node to highlight all connected paths</li>
                <li>Drag to pan the view</li>
                <li>Scroll or pinch to zoom</li>
                <li>Use the controls (bottom-left) to zoom and fit the view</li>
                <li>Click empty space to clear selections</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{
          padding: 0.1,
          minZoom: 0.4,
          maxZoom: 1,
        }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        connectOnClick={false}
        panOnScroll
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        connectionLineStyle={{ display: 'none' }}
      >
        <Background 
          gap={20}
          size={1}
          color="hsl(var(--border))"
        />
        <Controls 
          className="border-border! bg-background! [&_button]:bg-background! [&_button]:border-border! [&_button]:fill-foreground! hover:[&_button]:bg-accent!"
          showInteractive={false}
        />
        {/* <MiniMap 
          className="border-border! bg-background! hidden lg:block"
          nodeColor={(node) => {
            if (node.id.startsWith('layer-')) return 'transparent';
            const type = node.id.split('-')[0] as keyof typeof colors;
            return colors[type]?.bg || '#94a3b8';
          }}
          pannable
          zoomable
        /> */}
      </ReactFlow>
    </div>
  );
}
