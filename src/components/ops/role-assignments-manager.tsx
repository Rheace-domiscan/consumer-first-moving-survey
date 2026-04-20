"use client";

import { useState } from "react";

type RoleAssignment = {
  clerkUserId: string;
  role: "OWNER" | "OPERATOR" | "ADMIN";
  effectiveRole: "OWNER" | "OPERATOR" | "ADMIN";
  note: string | null;
  source: "db" | "env";
  user: {
    displayName: string;
    email: string | null;
  } | null;
  grantedBy: {
    displayName: string;
    email: string | null;
  } | null;
};

export function RoleAssignmentsManager({
  assignments,
}: {
  assignments: RoleAssignment[];
}) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<"OPERATOR" | "ADMIN">("OPERATOR");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function assignRole() {
    setPending("assign");
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        role,
        note,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to assign role.");
      setPending(null);
      return;
    }

    setMessage("Role assignment saved.");
    setPending(null);
    window.location.reload();
  }

  async function updateRole(
    clerkUserId: string,
    nextRole: "OPERATOR" | "ADMIN",
    nextNote: string,
  ) {
    setPending(`update:${clerkUserId}`);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/roles/${clerkUserId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: nextRole,
        note: nextNote,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to update role.");
      setPending(null);
      return;
    }

    setMessage("Role assignment updated.");
    setPending(null);
    window.location.reload();
  }

  async function removeRole(clerkUserId: string) {
    const confirmed = window.confirm(
      "Remove this explicit assignment and return the user to default owner access?",
    );

    if (!confirmed) {
      return;
    }

    setPending(`remove:${clerkUserId}`);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/roles/${clerkUserId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to remove role.");
      setPending(null);
      return;
    }

    setMessage("Role assignment removed.");
    setPending(null);
    window.location.reload();
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
        <h3 className="text-lg font-semibold text-white">Add or update assignment</h3>
        <p className="text-sm text-slate-300">
          Enter a Clerk user ID or exact email address. Explicit assignments override the default owner role.
        </p>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="user_... or person@example.com"
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <div className="grid gap-4 md:grid-cols-[0.35fr_0.65fr]">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as "OPERATOR" | "ADMIN")}
            className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="OPERATOR">Operator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why this role is being granted"
            className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={assignRole}
            disabled={pending !== null || !identifier.trim()}
            className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === "assign" ? "Saving..." : "Save assignment"}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <RoleAssignmentRow
            key={assignment.clerkUserId}
            assignment={assignment}
            pending={pending}
            onUpdate={updateRole}
            onRemove={removeRole}
          />
        ))}
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

function RoleAssignmentRow({
  assignment,
  pending,
  onUpdate,
  onRemove,
}: {
  assignment: RoleAssignment;
  pending: string | null;
  onUpdate: (clerkUserId: string, nextRole: "OPERATOR" | "ADMIN", nextNote: string) => Promise<void>;
  onRemove: (clerkUserId: string) => Promise<void>;
}) {
  const [role, setRole] = useState<"OPERATOR" | "ADMIN">(
    assignment.role === "ADMIN" ? "ADMIN" : "OPERATOR",
  );
  const [note, setNote] = useState(assignment.note ?? "");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            {assignment.user?.displayName ?? assignment.clerkUserId}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {assignment.user?.email ?? assignment.clerkUserId}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Effective role: {assignment.effectiveRole} • Source: {assignment.source}
            {assignment.grantedBy
              ? ` • Granted by ${assignment.grantedBy.displayName}`
              : ""}
          </p>
        </div>
        <div className="grid gap-3 md:min-w-[22rem]">
          <div className="grid gap-3 md:grid-cols-[0.35fr_0.65fr]">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "OPERATOR" | "ADMIN")}
              disabled={assignment.source === "env"}
              className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
            >
              <option value="OPERATOR">Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={assignment.source === "env"}
              className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onUpdate(assignment.clerkUserId, role, note)}
              disabled={pending !== null || assignment.source === "env"}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === `update:${assignment.clerkUserId}` ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              onClick={() => onRemove(assignment.clerkUserId)}
              disabled={pending !== null || assignment.source === "env"}
              className="rounded-full border border-rose-400/30 px-4 py-2 text-xs font-medium text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === `remove:${assignment.clerkUserId}` ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
