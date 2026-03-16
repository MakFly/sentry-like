"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  User,
  ChevronDown,
  Search,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email?: string;
  image?: string | null;
}

interface AssigneeDropdownProps {
  currentAssignee?: Member | null;
  members: Member[];
  onAssign: (userId: string | null) => void;
  isLoading?: boolean;
  className?: string;
}

function Avatar({ member, size = "md" }: { member: Member | null; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

  if (!member) {
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-issues-surface border border-issues-border", sizeClasses)}>
        <User className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </div>
    );
  }

  if (member.image) {
    return (
      <img
        src={member.image}
        alt={member.name || "User"}
        className={cn("rounded-full object-cover", sizeClasses)}
      />
    );
  }

  const initials = member.name
    ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : member.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-pulse-primary/20 text-pulse-primary font-semibold", sizeClasses)}>
      {initials}
    </div>
  );
}

export function AssigneeDropdown({
  currentAssignee,
  members,
  onAssign,
  isLoading,
  className,
}: AssigneeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredMembers = members.filter((member) => {
    const searchLower = search.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (userId: string | null) => {
    onAssign(userId);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          currentAssignee
            ? "border-pulse-primary/30 bg-pulse-primary/10 hover:bg-pulse-primary/20"
            : "border-issues-border bg-issues-surface hover:bg-issues-border",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : currentAssignee ? (
          <>
            <Avatar member={currentAssignee} size="sm" />
            <span className="text-foreground font-medium max-w-[100px] truncate">
              {currentAssignee.name || currentAssignee.email || "Assigned"}
            </span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assign</span>
          </>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-issues-border bg-issues-bg shadow-xl">
          {/* Search */}
          <div className="border-b border-issues-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-md border border-issues-border bg-issues-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse-primary focus:outline-none focus:ring-1 focus:ring-pulse-primary"
              />
            </div>
          </div>

          {/* Members list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {/* Unassign option */}
            {currentAssignee && (
              <button
                onClick={() => handleSelect(null)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-issues-surface"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-issues-border">
                  <X className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Unassign</span>
              </button>
            )}

            {/* Members */}
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-issues-surface",
                  currentAssignee?.id === member.id && "bg-pulse-primary/10"
                )}
              >
                <Avatar member={member} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {member.name || "Unknown"}
                  </p>
                  {member.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  )}
                </div>
                {currentAssignee?.id === member.id && (
                  <div className="h-2 w-2 rounded-full bg-pulse-primary" />
                )}
              </button>
            ))}

            {filteredMembers.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No members found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
