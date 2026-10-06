import RPC, { Client } from 'discord-rpc';
import type { A2SInfo, SteamPlayer } from './types.js';

let client: Client | undefined;
let ready = false;

function formatPlaytime(startedAt: number): string {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export async function connectDiscord(clientId: string): Promise<void> {
  client = new RPC.Client({ transport: 'ipc' });
  client.on('ready', () => { ready = true; });
  client.on('disconnected', () => { ready = false; });
  await client.login({ clientId });
}

export async function updatePresence(player: SteamPlayer, server: A2SInfo, startedAt: number): Promise<void> {
  if (!client || !ready) return;
  await client.setActivity({
    details: 'currently surfin triangles',
    state: `Map: ${server.map} | Server IP: ${player.gameserverip} | Players: ${server.players}/${server.maxPlayers} | Playtime: ${formatPlaytime(startedAt)}`,
    startTimestamp: startedAt,
    largeImageKey: 'css',
    largeImageText: server.name || 'Counter-Strike: Source',
    smallImageKey: process.env.DISCORD_SMALL_IMAGE_KEY ?? 'css_small',
    smallImageText: player.personaname,
    buttons: [{ label: 'KSF servers', url: 'https://ksf.surf/connect' }],
    instance: false
  });
}

export async function clearPresence(): Promise<void> {
  if (client && ready) await client.clearActivity();
}
