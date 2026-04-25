export function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    const protocol = forwardedProto ?? (host.includes("localhost") ? "http" : "http");
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export function getRedirectUrl(request: Request, pathname: string) {
  return new URL(pathname, getRequestOrigin(request));
}
