import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { getCurrentUserAccess } from "@/lib/authz";

export async function UserActions() {
  const access = await getCurrentUserAccess();

  if (!access.userId) {
    return (
      <div className="flex items-center gap-3">
        <SignInButton mode="modal">
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {access.isOps ? (
        <Link
          href="/ops/review"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Review queue
        </Link>
      ) : null}
      {access.isAdmin ? (
        <Link
          href="/ops/settings"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Admin settings
        </Link>
      ) : null}
      {access.isAdmin ? (
        <Link
          href="/ops/health"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Ops health
        </Link>
      ) : null}
      <Link
        href="/survey/list"
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
      >
        My surveys
      </Link>
      <UserButton afterSignOutUrl="/signed-out" />
    </div>
  );
}
