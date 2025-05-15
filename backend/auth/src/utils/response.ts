export function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
export function errorResponse(message: string, status = 500) {
  return jsonResponse({ data: null, error: message }, status);
}
