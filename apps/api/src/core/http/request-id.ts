export const requestIdHeader = "x-request-id";

export function resolveRequestId(request: Request) {
  const incoming = request.headers.get(requestIdHeader)?.trim();
  return incoming && incoming.length > 0 ? incoming : crypto.randomUUID();
}

export function injectRequestId(request: Request, requestId: string) {
  const headers = new Headers(request.headers);
  headers.set(requestIdHeader, requestId);
  return new Request(request, { headers });
}

export function attachRequestId(response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  headers.set(requestIdHeader, requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
