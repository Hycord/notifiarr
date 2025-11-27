'use client';

import { useEvents, useDeleteEvent, useUpdateEvent, useServers, useSinks } from '@/hooks/use-config-queries';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { processEventsIntoRows, isGroupRow, type EventTableRow } from './columns';
import { Plus, Zap, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EventConfig } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { InlineMultiSelect } from '@/components/inline-multi-select';

type SpacerRow = { type: 'spacer'; id: string; afterGroup?: string };

function isSpacerRow(row: any): row is SpacerRow {
  return row && typeof row === 'object' && 'type' in row && row.type === 'spacer';
}

interface SpacerRowProps {
  spacer: SpacerRow;
  activeId: string | null;
}

function SpacerRowComponent({ spacer, activeId }: SpacerRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: spacer.id,
  });
  
  // Don't render if not actively dragging - prevents layout shifts
  if (!activeId) return null;
  
  // Render as zero-height row with absolute positioned drop indicator
  return (
    <TableRow 
      ref={setNodeRef}
      className="relative"
      style={{ height: 0, padding: 0, border: 'none' }}
    >
      <TableCell colSpan={7} className="p-0 border-0" style={{ height: 0, padding: 0, lineHeight: 0 }}>
        {isOver && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary z-20" />
        )}
      </TableCell>
    </TableRow>
  );
}

interface SortableEventRowProps {
  row: EventTableRow;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onToggleGroup: (groupName: string) => void;
  onToggleGroupEvents: (groupName: string, enabled: boolean) => void;
  expandedGroups: Set<string>;
  activeId: string | null;
  activeEventGroup: string | null;
  servers: Array<{ id: string; displayName: string }>;
  sinks: Array<{ id: string; name: string }>;
  onUpdateEvent: (event: EventConfig) => void;
}

// Removed UngroupDropZone - ungrouping is now handled by dropping on group header

function SortableEventRow({ row, onDelete, onToggle, onToggleGroup, onToggleGroupEvents, expandedGroups, activeId, activeEventGroup, servers, sinks, onUpdateEvent }: SortableEventRowProps) {
  const isGroup = isGroupRow(row);
  const id = isGroup ? row.id : row.id;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  if (isGroup) {
    const isExpanded = expandedGroups.has(row.groupName);
    const allEnabled = row.events.every(e => e.enabled);
    const someEnabled = row.events.some(e => e.enabled);
    
    return (
      <TableRow ref={setNodeRef} style={{ ...style, height: '52px' }} className="cursor-pointer hover:bg-muted/50 bg-muted/30 relative">
        <TableCell {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </TableCell>
        <TableCell onClick={() => onToggleGroup(row.groupName)} className="font-medium">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {row.groupName}
            <Badge variant="default" className="ml-2">
              {row.events.length}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroupEvents(row.groupName, true);
              }}
              disabled={allEnabled}
            >
              Enable All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroupEvents(row.groupName, false);
              }}
              disabled={!someEnabled}
            >
              Disable All
            </Button>
          </div>
        </TableCell>
        <TableCell colSpan={4} />
      </TableRow>
    );
  }
  
  const event = row as EventConfig;
  const isGrouped = !!event.group;
  const isDraggingThis = isDragging;
  
  return (
    <TableRow ref={setNodeRef} style={style} className={`${isGrouped ? 'bg-muted/20 border-l-4 border-l-primary' : ''} relative`}>
      <TableCell {...attributes} {...listeners} className={isGrouped && !isDraggingThis ? 'pl-6' : ''}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      <TableCell className={`font-medium ${isGrouped && !isDraggingThis ? 'pl-8' : ''}`}>{event.name}</TableCell>
      <TableCell>
        <Badge
          variant={event.enabled ? 'default' : 'secondary'}
          className="cursor-pointer hover:opacity-80"
          onClick={() => onToggle(event.id, !event.enabled)}
        >
          {event.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{event.baseEvent}</Badge>
      </TableCell>
      <TableCell>
        <InlineMultiSelect
          value={event.serverIds || []}
          options={servers.map(s => ({ value: s.id, label: s.displayName }))}
          onChange={(newServerIds) => {
            onUpdateEvent({ ...event, serverIds: newServerIds });
          }}
          triggerText={(count) => `${count} server${count !== 1 ? 's' : ''}`}
          placeholder="0 servers"
        />
      </TableCell>
      <TableCell>
        <InlineMultiSelect
          value={event.sinkIds || []}
          options={sinks.map(s => ({ value: s.id, label: s.name }))}
          onChange={(newSinkIds) => {
            onUpdateEvent({ ...event, sinkIds: newSinkIds });
          }}
          triggerText={(count) => `${count} sink${count !== 1 ? 's' : ''}`}
          placeholder="0 sinks"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link href={`/events/${event.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{event.name}&quot;?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(event.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Calculate priorities based on order
function calculatePriorities(orderedEvents: EventConfig[]): Map<string, number> {
  const priorities = new Map<string, number>();
  const totalEvents = orderedEvents.length;
  orderedEvents.forEach((event, index) => {
    // Assign priorities from high to low (first item = highest priority)
    const priority = (totalEvents - index) * 100;
    priorities.set(event.id, priority);
  });
  return priorities;
}

export default function EventsPage() {
  const { data: events, isLoading, error, isError } = useEvents();
  const { data: servers = [] } = useServers();
  const { data: sinks = [] } = useSinks();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [localEvents, setLocalEvents] = useState<EventConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const deleteEvent = useDeleteEvent({
    onSuccess: () => toast.success('Event deleted successfully'),
    onError: (error) => toast.error(`Failed to delete event: ${error.message}`),
  });

  const updateEvent = useUpdateEvent({
    onSuccess: () => {},
    onError: (error) => toast.error(`Failed to update event: ${error.message}`),
  });

  // Initialize local events from fetched data
  useMemo(() => {
    if (events) {
      setLocalEvents([...events].sort((a, b) => (b.priority || 0) - (a.priority || 0)));
    }
  }, [events]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = (id: string, enabled: boolean) => {
    const event = localEvents.find(e => e.id === id);
    if (event) {
      updateEvent.mutate({ ...event, enabled });
    }
  };

  const handleToggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleToggleGroupEvents = (groupName: string, enabled: boolean) => {
    const groupEvents = localEvents.filter(e => e.group === groupName);
    groupEvents.forEach(event => {
      if (event.enabled !== enabled) {
        updateEvent.mutate({ ...event, enabled });
      }
    });
    toast.success(`${enabled ? 'Enabled' : 'Disabled'} all events in ${groupName}`);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    let overId = over.id as string;
    
    // Check if dropped on a spacer - spacers are used to ungroup items
    if (overId.startsWith('spacer-after-')) {
      const groupName = overId.replace('spacer-after-', '');
      const draggedEvent = localEvents.find(e => e.id === active.id);
      
      if (!draggedEvent || draggedEvent.id.startsWith('group-')) return;
      
      // Ungroup the event by removing the group property
      const { group, ...eventWithoutGroup } = draggedEvent as any;
      const updatedEvent = eventWithoutGroup as EventConfig;
      
      // Remove the dragged event from the list
      const eventsWithoutDragged = localEvents.filter(e => e.id !== draggedEvent.id);
      
      // Find the group's events to determine insertion point
      const groupEvents = eventsWithoutDragged.filter(e => e.group === groupName);
      
      if (groupEvents.length === 0) {
        // Group not found, shouldn't happen but add at end
        const reordered = [...eventsWithoutDragged, updatedEvent];
        updatePrioritiesAndSave(reordered);
        return;
      }
      
      // Insert right after the last event in the group
      const lastGroupEventIndex = eventsWithoutDragged.indexOf(groupEvents[groupEvents.length - 1]);
      const insertIndex = lastGroupEventIndex + 1;
      const reordered = [
        ...eventsWithoutDragged.slice(0, insertIndex),
        updatedEvent,
        ...eventsWithoutDragged.slice(insertIndex),
      ];
      
      updatePrioritiesAndSave(reordered);
      return;
    }
    
    const activeId = active.id as string;
    
    // Find if we're dragging a group or an individual event
    const activeIsGroup = activeId.startsWith('group-');
    const overIsGroup = overId.startsWith('group-');
    
    if (activeIsGroup) {
      // Dragging a group - move all events in the group
      const groupName = activeId.replace('group-', '');
      const groupEvents = localEvents.filter(e => e.group === groupName);
      
      // Find old position of the group (first event in group)
      const oldGroupIndex = localEvents.indexOf(groupEvents[0]);
      
      let targetIndex: number;
      
      if (overIsGroup) {
        const overGroupName = overId.replace('group-', '');
        const overGroupEvents = localEvents.filter(e => e.group === overGroupName);
        targetIndex = localEvents.indexOf(overGroupEvents[0]);
      } else {
        // Dropped on an event
        targetIndex = localEvents.findIndex(e => e.id === overId);
      }
      
      // Remove the group from the list
      const eventsWithoutGroup = localEvents.filter(e => e.group !== groupName);
      
      // Find the new insertion index in the filtered list
      // We need to account for whether we're moving up or down
      let newIndex: number;
      if (targetIndex < oldGroupIndex) {
        // Moving up - insert before the target
        newIndex = eventsWithoutGroup.findIndex(e => localEvents.indexOf(e) >= targetIndex);
      } else {
        // Moving down - insert after the target
        newIndex = eventsWithoutGroup.findIndex(e => localEvents.indexOf(e) > targetIndex);
      }
      
      if (newIndex === -1) newIndex = eventsWithoutGroup.length;
      
      // Reinsert group events at new position
      const reordered = [
        ...eventsWithoutGroup.slice(0, newIndex),
        ...groupEvents,
        ...eventsWithoutGroup.slice(newIndex),
      ];
      
      updatePrioritiesAndSave(reordered);
    } else {
      // Dragging an individual event
      const draggedEvent = localEvents.find(e => e.id === activeId);
      if (!draggedEvent) return;
      
      const oldIndex = localEvents.findIndex(e => e.id === activeId);
      let newIndex: number;
      let newGroup: string | undefined;
      
      if (overIsGroup) {
        // Dropped on a group header
        const overGroupName = overId.replace('group-', '');
        const overGroupEvents = localEvents.filter(e => e.group === overGroupName);
        
        if (draggedEvent.group === overGroupName) {
          // Dragging FROM this group onto its header - ungroup the item
          newIndex = localEvents.indexOf(overGroupEvents[0]);
          newGroup = undefined;
        } else if (oldIndex < localEvents.indexOf(overGroupEvents[0])) {
          // Moving down onto the group header - add to the group at the beginning
          newIndex = localEvents.indexOf(overGroupEvents[0]);
          newGroup = overGroupName;
        } else {
          // Moving up onto the group header - place before the group, don't add to it
          newIndex = localEvents.indexOf(overGroupEvents[0]);
          newGroup = draggedEvent.group;
        }
      } else {
        // Dropped on an event
        const overEvent = localEvents.find(e => e.id === overId);
        newIndex = localEvents.findIndex(e => e.id === overId);
        
        // Determine grouping based on the target event
        if (overEvent?.group && expandedGroups.has(overEvent.group)) {
          // Target is in an expanded group
          if (draggedEvent.group === overEvent.group) {
            // Same group - keep it
            newGroup = draggedEvent.group;
          } else {
            // Different group or no group - auto-group with target
            newGroup = overEvent.group;
          }
        } else {
          // Target is not in a group (or group is collapsed) - ungroup the dragged item
          newGroup = undefined;
        }
      }
      
      // Create the updated event - if newGroup is undefined, explicitly remove it
      let updatedEvent: EventConfig;
      if (newGroup === undefined) {
        const { group, ...eventWithoutGroup } = draggedEvent as any;
        updatedEvent = eventWithoutGroup as EventConfig;
      } else {
        updatedEvent = { ...draggedEvent, group: newGroup };
      }
      
      // Reorder the events using arrayMove logic
      // This uses the same logic as @dnd-kit/sortable's arrayMove utility
      const reordered = arrayMove(localEvents, oldIndex, newIndex).map(e => {
        if (e.id === activeId) {
          return updatedEvent;
        }
        return e;
      });
      
      updatePrioritiesAndSave(reordered);
    }
  };
  
  const updatePrioritiesAndSave = (reordered: EventConfig[]) => {
    const newPriorities = calculatePriorities(reordered);
    const eventsWithNewPriorities = reordered.map(e => {
      const newPriority = newPriorities.get(e.id) || 0;
      
      // If event group is undefined or doesn't exist, omit it from the object
      if (!e.group) {
        const { group, ...eventWithoutGroup } = e as any;
        return {
          ...eventWithoutGroup,
          priority: newPriority,
        } as EventConfig;
      }
      
      // Otherwise include all properties including group
      return {
        ...e,
        priority: newPriority,
      };
    });
    
    setLocalEvents(eventsWithNewPriorities);
    
    // Save all updated priorities and groups to backend
    eventsWithNewPriorities.forEach(event => {
      updateEvent.mutate(event);
    });
    
    toast.success('Event order updated');
  };

  // Get the group of the currently dragged event
  const activeEventGroup = useMemo(() => {
    if (!activeId || activeId.startsWith('group-') || activeId.startsWith('spacer-') || activeId.startsWith('ungroup-')) return null;
    const activeEvent = localEvents.find(e => e.id === activeId);
    return activeEvent?.group || null;
  }, [activeId, localEvents]);

  // Process events into groups and expand them
  const tableData = useMemo(() => {
    if (!localEvents || localEvents.length === 0) return [];
    const rows = processEventsIntoRows(localEvents);
    
    // Expand groups that are marked as expanded and add spacer zones for ungrouping
    const expandedRows: (EventTableRow | { type: 'spacer'; id: string; afterGroup?: string })[] = [];
    rows.forEach((row) => {
      expandedRows.push(row);
      
      if (isGroupRow(row)) {
        // Add spacer right after group header when dragging an event FROM this group
        // This allows ungrouping by dropping on the spacer
        if (activeEventGroup === row.groupName) {
          expandedRows.push({ type: 'spacer', id: `spacer-after-${row.groupName}`, afterGroup: row.groupName });
        }
        
        // If group is expanded, add its events after the header (or after the spacer if present)
        if (expandedGroups.has(row.groupName)) {
          expandedRows.push(...row.events);
        }
      }
    });
    
    return expandedRows;
  }, [localEvents, expandedGroups, activeId, activeEventGroup]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Events</h2>
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Events</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Events</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Events</h2>
            <p className="text-muted-foreground">Manage event filters and routing</p>
          </div>
          <Link href="/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first event configuration.
            </p>
            <Link href="/events/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Base Event</TableHead>
                    <TableHead>Servers</TableHead>
                    <TableHead>Sinks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={tableData.filter(row => !isSpacerRow(row)).map(row => isGroupRow(row as EventTableRow) ? (row as any).id : (row as any).id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tableData.map((row) => {
                      if (isSpacerRow(row)) {
                        return <SpacerRowComponent key={row.id} spacer={row} activeId={activeId} />;
                      }
                      return (
                        <SortableEventRow
                          key={isGroupRow(row) ? row.id : row.id}
                          row={row}
                          onDelete={(id) => deleteEvent.mutate(id)}
                          onToggle={handleToggle}
                          onToggleGroup={handleToggleGroup}
                          onToggleGroupEvents={handleToggleGroupEvents}
                          expandedGroups={expandedGroups}
                          activeId={activeId}
                          activeEventGroup={activeEventGroup}
                          servers={servers}
                          sinks={sinks}
                          onUpdateEvent={(event) => updateEvent.mutate(event)}
                        />
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </div>
          </DndContext>
        )}
      </div>
    </AppLayout>
  );
}
