export function verifyBasicAuth(header: string | null): boolean {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "admin";
  if (!header || !header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6).trim());
    const idx = decoded.indexOf(":");
    if (idx === -1) return false;
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}

export function unauthorizedResponse(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="portfolio-admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}
