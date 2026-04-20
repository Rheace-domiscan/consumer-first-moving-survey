import { env } from "@/lib/env";

export function hasValidJobRunnerSecret(request: Request) {
  if (!env.jobRunnerSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-job-secret");
  const bearer = request.headers.get("authorization");
  const bearerSecret = bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : null;

  return headerSecret === env.jobRunnerSecret || bearerSecret === env.jobRunnerSecret;
}
