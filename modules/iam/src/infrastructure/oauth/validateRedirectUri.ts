export function validateRedirectUri(provider: string, redirectUri: string): string {
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new Error(`${provider} redirect URI must be an absolute URL`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`${provider} redirect URI must use http or https`);
  }

  if (process.env['NODE_ENV'] === 'production' && parsed.protocol !== 'https:') {
    throw new Error(`${provider} redirect URI must use HTTPS in production`);
  }

  return redirectUri;
}
