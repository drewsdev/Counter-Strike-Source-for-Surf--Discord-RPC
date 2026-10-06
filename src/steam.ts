import type { SteamPlayer } from './types.js';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)\/?$/;

export function createSteamLoginUrl(publicUrl: string): string {
  const returnUrl = new URL('/auth/steam/callback', publicUrl);
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl.toString(),
    'openid.realm': new URL(publicUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return `${STEAM_OPENID_ENDPOINT}?${params}`;
}

export async function verifySteamLogin(query: Record<string, string | undefined>): Promise<string> {
  if (query['openid.mode'] !== 'id_res' || !query['openid.claimed_id']) {
    throw new Error('Steam did not return a valid OpenID assertion.');
  }

  const verification = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) verification.set(key, value);
  }
  verification.set('openid.mode', 'check_authentication');

  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: verification
  });
  if (!response.ok || !(await response.text()).includes('is_valid:true')) {
    throw new Error('Steam OpenID assertion could not be verified.');
  }

  const match = query['openid.claimed_id'].match(STEAM_ID_PATTERN);
  if (!match) throw new Error('Steam returned an invalid SteamID64.');
  return match[1];
}

export async function getPlayerSummary(apiKey: string, steamId: string): Promise<SteamPlayer> {
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('steamids', steamId);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Steam Web API returned HTTP ${response.status}.`);
  const data = await response.json() as { response?: { players?: SteamPlayer[] } };
  const player = data.response?.players?.[0];
  if (!player) throw new Error('Steam Web API returned no player summary.');
  return player;
}

export function assertPublicSteamPrivacy(player: SteamPlayer): void {
  if (player.communityvisibilitystate !== 3) {
    throw new Error('Your Steam profile must be public. Set Profile privacy to Public, then log in again.');
  }

  const gameDetailsVisible = Boolean(player.gameid || player.gameextrainfo || player.gameserverip);
  if (!gameDetailsVisible) {
    throw new Error('Your Steam game details must be public. Set Game details to Public, then log in again while Counter-Strike: Source is running.');
  }
}
