// Générateur de JWT pour FloDrama (Cloudflare Workers, algorithme HS256)
// Nécessite une variable d'environnement env.JWT_SECRET

/**
 * Génère un JWT signé pour l'utilisateur FloDrama
 * @param user Objet utilisateur (doit contenir au moins id, email, display_name)
 * @param env Environnement Cloudflare Workers (avec JWT_SECRET)
 * @returns JWT string
 */
export async function createJWT(user: any, env: any): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const payload = {
    sub: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url || '',
    provider: user.provider || 'local',
    provider_id: user.provider_id || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 jours
  };
  function base64url(input: string): string {
    return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  const encoder = new TextEncoder();
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  // Convert signature ArrayBuffer to base64url
  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
