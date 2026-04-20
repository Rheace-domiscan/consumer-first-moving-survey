import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listDetailedRoleAssignments } from "@/lib/clerk-users";
import { APP_ROLES, requirePageRole } from "@/lib/authz";
import { getOrCreateGlobalRetentionPolicy } from "@/lib/retention";
import { formatDateTime } from "@/lib/format";
import { Header } from "@/components/layout/header";
import { AdminSettingsForm } from "@/components/ops/admin-settings-form";
import { RoleAssignmentsManager } from "@/components/ops/role-assignments-manager";
import { SectionCard } from "@/components/ui/section-card";

export default async function OpsSettingsPage() {
  await requirePageRole(APP_ROLES.ADMIN);

  const [policy, assignments, recentRuns] = await Promise.all([
    getOrCreateGlobalRetentionPolicy(),
    listDetailedRoleAssignments(),
    prisma.retentionRun.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Admin settings</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Roles, policy, and retention runs</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                This page controls operator/admin access, destructive retention behavior, and the
                policy that decides when surveys move from active to archived and then to purge.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ops/review"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              >
                Open review queue
              </Link>
              <Link
                href="/survey/list"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
              >
                Back to drafts
              </Link>
            </div>
          </div>
        </SectionCard>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Retention policy</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Archive windows are non-destructive. Media pruning, audit deletion, and full survey purge
              only happen when destructive retention is enabled.
            </p>
            <div className="mt-6">
              <AdminSettingsForm policy={policy} />
            </div>
          </SectionCard>

          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Recent retention runs</h2>
            <div className="mt-5 grid gap-4">
              {recentRuns.length ? (
                recentRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-medium text-white">{formatDateTime(run.createdAt)}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Archived {run.archivedCount}, purged {run.purgedCount}, media pruned {run.mediaPurgedCount}, audit rows pruned {run.auditPurgedCount}.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{run.notes || "No notes recorded."}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  No retention runs have been recorded yet.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard>
            <h2 className="text-xl font-semibold text-white">Role assignments</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Everyone starts as an owner. Add explicit assignments only for ops users who should
              review surveys, manage retention, or administer policy.
            </p>
            <div className="mt-6">
              <RoleAssignmentsManager assignments={assignments} />
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
