/**
 * Server Actions call redirect() (e.g. requireUser() sending an expired
 * session to /login), which throws a special Next.js control-flow error.
 * Client-side try/catch around an action call must let that propagate
 * instead of treating it as a normal failure.
 */
export function rethrowIfRedirectError(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}
