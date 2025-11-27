'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  initialSorting?: SortingState;
  globalFilterFn?: (row: TData, filterValue: string) => boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  initialSorting = [],
  globalFilterFn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Filter data using global filter function if provided
  const filteredData = React.useMemo(() => {
    if (!globalFilterFn || !globalFilter) return data;
    return data.filter((row) => globalFilterFn(row, globalFilter));
  }, [data, globalFilter, globalFilterFn]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      {(searchKey || globalFilterFn) && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilterFn ? globalFilter : (table.getColumn(searchKey!)?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              if (globalFilterFn) {
                setGlobalFilter(event.target.value);
              } else if (searchKey) {
                table.getColumn(searchKey)?.setFilterValue(event.target.value);
              }
            }}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isActionsColumn = header.column.id === 'actions';
                  const isBeforeActions = index < headerGroup.headers.length - 1 && headerGroup.headers[index + 1].column.id === 'actions';
                  return (
                    <TableHead 
                      key={header.id}
                      className={isActionsColumn ? 'sticky right-0 p-0' : isBeforeActions ? 'border-r-0' : ''}
                    >
                      {isActionsColumn ? (
                        <div className="bg-background border-l px-4 h-full flex items-center">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                      ) : (
                        header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isActionsColumn = cell.column.id === 'actions';
                    const isBeforeActions = index < row.getVisibleCells().length - 1 && row.getVisibleCells()[index + 1].column.id === 'actions';
                    return (
                      <TableCell 
                        key={cell.id}
                        className={isActionsColumn ? 'sticky right-0 p-0' : isBeforeActions ? 'border-r-0' : ''}
                      >
                        {isActionsColumn ? (
                          <div className="bg-background border-l px-2 py-2 h-full flex items-center">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
