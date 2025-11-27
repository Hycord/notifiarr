"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type MultiSelectOption = { value: string; label?: string; disabled?: boolean }

export interface MultiSelectProps {
  options: MultiSelectOption[]
  values?: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  emptyLabel?: string
  className?: string
  disabled?: boolean
  showSelectAll?: boolean
  selectAllLabel?: string
}

export function MultiSelect({
  options,
  values = [],
  onChange,
  placeholder = "Type to search…",
  emptyLabel = "No results found.",
  className,
  disabled,
  showSelectAll = false,
  selectAllLabel = "All",
}: MultiSelectProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const selected = new Set(values)

  const selectableOptions = React.useMemo(() => options.filter((opt) => !opt.disabled), [options])
  const allSelected = selectableOptions.length > 0 && selectableOptions.every((opt) => selected.has(opt.value))

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((opt) => {
      const label = opt.label || opt.value
      return label.toLowerCase().includes(lower)
    })
  }, [options, search])

  function toggle(val: string) {
    const next = new Set(values)
    if (next.has(val)) next.delete(val)
    else next.add(val)
    onChange(Array.from(next))
    setSearch("")
    inputRef.current?.focus()
  }

  function remove(val: string) {
    const next = values.filter((v) => v !== val)
    onChange(next)
  }

  function toggleAll() {
    if (allSelected) {
      onChange([])
    } else {
      onChange(selectableOptions.map((opt) => opt.value))
    }
    setSearch("")
    inputRef.current?.focus()
  }

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {values.map((val) => {
          const opt = options.find((o) => o.value === val)
          const label = opt?.label || val
          return (
            <Badge key={val} variant="secondary" className="gap-1">
              {label}
              <button
                type="button"
                className="ml-1 inline-flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  remove(val)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
              </button>
            </Badge>
          )
        })}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          <div className="max-h-60 overflow-y-auto">
            {showSelectAll && !search && (
              <div
                role="option"
                tabIndex={0}
                aria-selected={allSelected}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground font-medium border-b mb-1",
                  allSelected && "bg-accent/50"
                )}
                onClick={toggleAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleAll()
                  }
                }}
              >
                <span className="mr-2 h-4 w-4 flex items-center justify-center">
                  {allSelected && "✓"}
                </span>
                <span>{selectAllLabel}</span>
              </div>
            )}
            {filteredOptions.map((opt) => {
              const isSelected = selected.has(opt.value)
              return (
                <div
                  key={opt.value}
                  role="option"
                  tabIndex={opt.disabled ? -1 : 0}
                  aria-selected={isSelected}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    opt.disabled && "pointer-events-none opacity-50",
                    isSelected && "bg-accent/50"
                  )}
                  onClick={() => !opt.disabled && toggle(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      !opt.disabled && toggle(opt.value)
                    }
                  }}
                >
                  <span className="mr-2 h-4 w-4 flex items-center justify-center">
                    {isSelected && "✓"}
                  </span>
                  <span>{opt.label || opt.value}</span>
                  {opt.disabled && <span className="ml-2 text-xs text-muted-foreground">(disabled)</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {isOpen && search && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          <p className="text-sm text-muted-foreground text-center py-2">{emptyLabel}</p>
        </div>
      )}
    </div>
  )
}
