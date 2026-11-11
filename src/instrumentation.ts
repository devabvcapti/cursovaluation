/**
 * Diagnostic-only observability hooks (no behavior change). Added because
 * Hostinger's own "Logs de execução" panel showed the Next.js process
 * repeatedly restarting ("Ready in 0ms" banners seconds apart) with zero
 * correlated exception ever logged — the crash wasn't something our own
 * route-level try/catch blocks could see, so this uses Next's own
 * instrumentation hooks (stable since v15) to capture it regardless of
 * where in the request lifecycle it happens.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Belt-and-suspenders: catches anything that escapes Next's own
  // `onRequestError` capture (e.g. a rejection from a dangling background
  // task outside the request lifecycle Next tracks).
  process.on("unhandledRejection", (reason) => {
    console.error(
      "[instrumentation] unhandledRejection:",
      reason instanceof Error ? (reason.stack ?? reason.message) : reason,
    );
  });
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  console.error(
    "[instrumentation] onRequestError:",
    JSON.stringify({
      message,
      digest,
      stack,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  );
}
