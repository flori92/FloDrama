// Handler OAuth Google pour FloDrama (Cloudflare Worker)
// Prérequis : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI dans env
import { jsonResponse, errorResponse } from '../utils/response';
import { getOrCreateUserAndJWT } from '../utils/auth';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

function buildGoogleAuthURL(env, state) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function handleGoogleAuth(request: Request, url: URL, env: any) {
  // Génère un état anti-CSRF simple
  const state = Math.random().toString(36).substring(2);
  // Redirige vers Google OAuth
  return Response.redirect(buildGoogleAuthURL(env, state), 302);
}

export async function handleGoogleCallback(request: Request, url: URL, env: any) {
  const code = url.searchParams.get('code');
  if (!code) { return errorResponse('Code manquant', 400); }
  // Échange le code contre un token Google
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!tokenRes.ok) { return errorResponse('Erreur token Google', 401); }
  const tokenData = await tokenRes.json();
  // Récupère l’info utilisateur Google
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  if (!userRes.ok) { return errorResponse('Erreur userinfo Google', 401); }
  const userInfo = await userRes.json();
  // Crée/utilise l’utilisateur FloDrama et génère un JWT
  const { jwt, user } = await getOrCreateUserAndJWT({
    email: userInfo.email,
    display_name: userInfo.name,
    avatar_url: userInfo.picture,
    provider: 'google',
    provider_id: userInfo.sub
  }, env);
  // Redirige vers le frontend avec le JWT dans l’URL
  const frontendRedirect = env.FRONTEND_OAUTH_REDIRECT || 'https://flodrama.example.com/oauth-callback';
  return Response.redirect(`${frontendRedirect}?token=${jwt}`, 302);
}
