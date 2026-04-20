export const dynamic = "force-static";

export default function SignedOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Session closed</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Signed out cleanly</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          This page stays outside authenticated routing so browser and test teardown can finish without
          re-entering Clerk session refresh flows.
        </p>
      </div>
    </main>
  );
}
