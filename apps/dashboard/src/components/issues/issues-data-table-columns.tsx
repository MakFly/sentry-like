"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileCode2Icon,
  GlobeIcon,
  TerminalIcon,
  MessageSquareIcon,
  AlertTriangleIcon,
  PlayCircleIcon,
  XCircleIcon,
  RotateCcwIcon,
  UsersIcon,
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useUpdateGroupStatus } from "@/lib/trpc/hooks"

import type { ErrorLevel, IssueStatus } from "@/server/api"
import { detectEventSource } from "@/lib/event-source"

export interface IssueGroup {
  fingerprint: string
  message: string
  file: string
  line: number
  url?: string | null
  level: ErrorLevel
  count: number
  usersAffected?: number
  firstSeen: Date
  lastSeen: Date
  hasReplay?: boolean
  status?: IssueStatus
  resolvedAt?: Date | string | null
}

const sourceIcons = {
  Globe: GlobeIcon,
  Terminal: TerminalIcon,
  MessageSquare: MessageSquareIcon,
  AlertTriangle: AlertTriangleIcon,
} as const

interface IssuesDataTableColumnsProps {
  orgSlug: string
  projectSlug: string
  maxCount: number
  onStatusChange?: () => void
}

function getLevelColor(level: ErrorLevel): string {
  const levelLower = level.toLowerCase()
  switch (levelLower) {
    case "error":
      return "signal-error"
    case "fatal":
      return "signal-fatal"
    case "warning":
      return "signal-warning"
    case "info":
      return "signal-info"
    case "debug":
      return "signal-debug"
    default:
      return "outline"
  }
}

function getStatusColor(status: IssueStatus): string {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case "resolved":
      return "success"
    case "ignored":
      return "secondary"
    case "open":
    default:
      return "destructive"
  }
}

export function createIssuesColumns({
  orgSlug,
  projectSlug,
  maxCount,
  onStatusChange,
}: IssuesDataTableColumnsProps): ColumnDef<IssueGroup, any>[] {
  return [
    {
      accessorKey: "level",
      header: "Signal",
      cell: ({ row }) => {
        const level = row.getValue("level") as ErrorLevel
        const isCritical = level === "fatal" || level === "error"

        return (
          <div className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${
                isCritical ? "animate-pulse" : ""
              } bg-${getLevelColor(level)}`}
            />
            <Badge variant={getLevelColor(level) as any} className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              {level}
            </Badge>
          </div>
        )
      },
      sortingFn: (a, b) => {
        const levelOrder = ["fatal", "error", "warning", "info", "debug"]
        const aLevel = a.original.level.toLowerCase()
        const bLevel = b.original.level.toLowerCase()
        return levelOrder.indexOf(aLevel) - levelOrder.indexOf(bLevel)
      },
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const source = detectEventSource(row.original.url)
        const Icon = sourceIcons[source.icon]

        return (
          <Badge variant="outline" className={`gap-1 px-1.5 py-0.5 text-[10px] ${source.color}`}>
            <Icon className="size-3" />
            {source.label}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "message",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-left"
        >
          Message
          {column.getIsSorted() === "asc" && (
            <ChevronUpIcon className="ml-2 size-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <ChevronDownIcon className="ml-2 size-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <IssueMessageViewer row={row} orgSlug={orgSlug} projectSlug={projectSlug} maxLength={80} />
      ),
    },
    {
      accessorKey: "strength",
      header: "Strength",
      cell: ({ row }) => {
        const count = row.original.count
        const strength = maxCount > 0 ? (count / maxCount) * 100 : 0

        return (
          <div className="hidden w-24 lg:block">
            <Progress value={strength} className="h-1.5" />
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const { file, line } = row.original

        const displayFile = file.split("/").slice(-2).join("/")

        return (
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <FileCode2Icon className="size-3 shrink-0" />
            <span className="truncate font-mono">
              {displayFile}:{line}
            </span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "replay",
      header: () => <div className="hidden text-center sm:block">Replay</div>,
      cell: ({ row }) => {
        const { hasReplay } = row.original

        return (
          <div className="hidden text-center sm:block">
            {hasReplay && (
              <Badge variant="outline" className="gap-1 px-1.5 py-0.5">
                <PlayCircleIcon className="size-3" />
                <span className="text-[10px]">View</span>
              </Badge>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "count",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Freq
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm font-medium">{row.original.count}</span>
          <span className="text-[10px] text-muted-foreground">events</span>
        </div>
      ),
    },
    {
      accessorKey: "usersAffected",
      header: ({ column }) => (
        <div className="hidden text-right lg:block">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Users
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const users = row.original.usersAffected ?? 0
        if (users === 0) return <div className="hidden lg:block" />
        return (
          <div className="hidden items-center justify-end gap-1.5 lg:flex">
            <UsersIcon className="size-3 text-muted-foreground" />
            <span className="text-sm font-medium">{users}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "lastSeen",
      header: ({ column }) => (
        <div className="hidden text-right sm:block">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0"
          >
            Last
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="ml-2 size-4" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="ml-2 size-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const lastSeen = row.original.lastSeen
        return (
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span>
              {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "open"
        const resolvedAt = row.original.resolvedAt
        // Regression: issue is open but was previously resolved
        const isRegression = status === "open" && resolvedAt != null

        return (
          <div className="hidden gap-1 sm:flex">
            <Badge
              variant={getStatusColor(status as IssueStatus) as any}
              className="px-1.5 py-0.5 text-[10px]"
            >
              {status}
            </Badge>
            {isRegression && (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500"
              >
                Regressed
              </Badge>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.status === value
      },
    },
    {
      id: "actions",
      header: () => <div className="w-8" />,
      cell: ({ row }) => (
        <IssueActionsDropdown
          issue={row.original}
          orgSlug={orgSlug}
          projectSlug={projectSlug}
          onStatusChange={onStatusChange}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

function IssueActionsDropdown({
  issue,
  orgSlug,
  projectSlug,
  onStatusChange,
}: {
  issue: IssueGroup
  orgSlug: string
  projectSlug: string
  onStatusChange?: () => void
}) {
  const updateStatus = useUpdateGroupStatus()
  const currentStatus = issue.status || "open"

  const handleStatusChange = (newStatus: "open" | "resolved" | "ignored") => {
    toast.promise(
      updateStatus.mutateAsync(
        { fingerprint: issue.fingerprint, status: newStatus },
        { onSuccess: () => onStatusChange?.() }
      ),
      {
        loading: newStatus === "resolved"
          ? "Marking as resolved..."
          : newStatus === "ignored"
            ? "Ignoring signal..."
            : "Reopening signal...",
        success: newStatus === "resolved"
          ? "Signal marked as resolved"
          : newStatus === "ignored"
            ? "Signal ignored"
            : "Signal reopened",
        error: "Failed to update status",
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
          size="icon"
        >
          <ChevronDownIcon />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/${orgSlug}/${projectSlug}/issues/${issue.fingerprint}`}>
            <ArrowRightIcon className="mr-2 size-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {currentStatus !== "resolved" && (
          <DropdownMenuItem onClick={() => handleStatusChange("resolved")}>
            <CheckCircleIcon className="mr-2 size-4" />
            Mark Resolved
          </DropdownMenuItem>
        )}
        {currentStatus !== "ignored" && (
          <DropdownMenuItem onClick={() => handleStatusChange("ignored")}>
            <XCircleIcon className="mr-2 size-4" />
            Ignore
          </DropdownMenuItem>
        )}
        {currentStatus !== "open" && (
          <DropdownMenuItem onClick={() => handleStatusChange("open")}>
            <RotateCcwIcon className="mr-2 size-4" />
            Reopen
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function IssueMessageViewer({
  row,
  orgSlug,
  projectSlug,
  maxLength = 80,
}: {
  row: any
  orgSlug: string
  projectSlug: string
  maxLength?: number
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const { message, file, line, level, fingerprint } = row.original

  const truncatedMessage =
    message.length > maxLength
      ? message.slice(0, maxLength).trim() + "..."
      : message

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left hover:text-foreground"
        >
          <span className="truncate text-sm font-medium" title={message}>
            {truncatedMessage}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="gap-1">
          <DialogTitle>Signal Details</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {fingerprint}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Message</label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                {message}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Level</label>
                <Badge variant={getLevelColor(level) as any} className="w-fit">
                  {level.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Occurrences</label>
                <div className="text-2xl font-semibold">{row.original.count}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Location</label>
              <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs">
                {file}:{line}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">First Seen</label>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(row.original.firstSeen), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Last Seen</label>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(row.original.lastSeen), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button asChild className="w-full">
            <Link href={`/dashboard/${orgSlug}/${projectSlug}/issues/${fingerprint}`}>
              View Full Details
            </Link>
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
