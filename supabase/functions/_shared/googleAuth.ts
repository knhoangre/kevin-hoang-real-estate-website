/**
 * An access token for Google's APIs from a service account's JSON key.
 *
 * No Google client library: the exchange is one signed JWT posted to the
 * token endpoint (RFC 7523), and Deno's WebCrypto signs RS256 itself. The key
 * is the `GOOGLE_SERVICE_ACCOUNT_JSON` function secret, which Kevin pastes in;
 * it is never logged and never returned.
 *
 * The token is kept for the life of the function instance, less a minute, so
 * opening /admin/visitors twice in a row signs once.
 */

export interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

/** The key file's contents, or null when the secret is absent or not a key. */
export const parseServiceAccount = (raw: string | undefined): ServiceAccount | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.client_email === 'string' && typeof parsed?.private_key === 'string') {
      return parsed as ServiceAccount;
    }
  } catch {
    // Not JSON: treated the same as no secret, and the page says how to set it.
  }
  return null;
};

const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const encodeJson = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));

const pemToDer = (pem: string): Uint8Array => {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
};

let cached: { key: string; token: string; expires: number } | null = null;

export async function googleAccessToken(account: ServiceAccount, scopes: string[]): Promise<string> {
  const cacheKey = `${account.client_email} ${scopes.join(' ')}`;
  if (cached && cached.key === cacheKey && cached.expires > Date.now() + 60_000) return cached.token;

  const tokenUri = account.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    encodeJson({ alg: 'RS256', typ: 'JWT' }) +
    '.' +
    encodeJson({
      iss: account.client_email,
      scope: scopes.join(' '),
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    });

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  );

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.access_token !== 'string') {
    // Google's own error code only ("invalid_grant"), never the key.
    throw new Error(`Google sign-in failed: ${body.error ?? res.status}`);
  }

  cached = { key: cacheKey, token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return body.access_token;
}
