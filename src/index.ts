import 'dotenv/config';
import express from 'express';
import { assertPublicSteamPrivacy, createSteamLoginUrl, getPlayerSummary, verifySteamLogin } from './steam.js';
import { queryA2SInfo } from './a2s.js';
import { clearPresence, connectDiscord, updatePresence } from './discord.js';

const port = Number(process.env.PORT ?? 3000);
const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}`;
const steamApiKey = process.env.STEAM_API_KEY;
const discordClientId = process.env.DISCORD_CLIENT_ID;
const refreshMs = Number(process.env.PRESENCE_REFRESH_MS ?? 30000);

if (!steamApiKey) throw new Error('STEAM_API_KEY is required.');
if (!discordClientId) throw new Error('DISCORD_CLIENT_ID is required.');

const app = express();
const sessions = new Map<string, { steamId: string; startedAt?: number; address?: string }>();

app.get('/', (_request, response) => response.type('html').send('<h1>Counter-Strike: Source Discord RPC</h1><a href="/auth/steam">Log in with Steam</a>'));
app.get('/auth/steam', (_request, response) => response.redirect(createSteamLoginUrl(publicUrl)));
app.get('/auth/steam/callback', async (request, response) => {
  try {
    const sessionKey = request.ip ?? 'unknown-client';
    const query = Object.fromEntries(Object.entries(request.query).map(([key, value]) => [key, typeof value === 'string' ? value : undefined]));
    const steamId = await verifySteamLogin(query);
    const player = await getPlayerSummary(steamApiKey as string, steamId);
    assertPublicSteamPrivacy(player);
    sessions.set(sessionKey, { steamId });
    response.send('Steam login succeeded. The local Discord RPC is now tracking your game. You can close this tab.');
    void refreshPresence(sessionKey);
  } catch (error) {
    response.status(400).send(error instanceof Error ? error.message : 'Steam login failed.');
  }
});

async function refreshPresence(sessionKey: string): Promise<void> {
  const session = sessions.get(sessionKey);
  if (!session) return;
  try {
    const player = await getPlayerSummary(steamApiKey as string, session.steamId);
    if (player.gameid !== '240' || !player.gameserverip) {
      session.startedAt = undefined;
      session.address = undefined;
      await clearPresence();
      return;
    }
    if (session.address !== player.gameserverip) {
      session.startedAt = Date.now();
      session.address = player.gameserverip;
    }
    const server = await queryA2SInfo(player.gameserverip);
    await updatePresence(player, server, session.startedAt ?? Date.now());
  } catch (error) {
    console.error(`[presence] ${error instanceof Error ? error.message : error}`);
  }
}

setInterval(() => {
  for (const sessionKey of sessions.keys()) void refreshPresence(sessionKey);
}, refreshMs);

await connectDiscord(discordClientId);
app.listen(port, () => console.log(`Steam login available at ${publicUrl}/auth/steam`));
