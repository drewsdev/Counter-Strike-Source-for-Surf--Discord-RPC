import RPC, { Client } from 'discord-rpc';
import type { A2SInfo, SteamPlayer } from './types.js';

let client: Client | undefined;
let ready = false;

export async function connectDiscord(clientId: string): Promise<void> {
  client = new RPC.Client({ transport: 'ipc' });
  client.on('ready', () => { ready = true; });
  client.on('disconnected', () => { ready = false; });
  await client.login({ clientId });
}

export async function updatePresence(player: SteamPlayer, server: A2SInfo, startedAt: number): Promise<void> {
  if (!client || !ready) return;
  await client.setActivity({
    details: server.name || 'Counter-Strike: Source',
    state: `${server.map} | ${server.players}/${server.maxPlayers} players`,
    startTimestamp: startedAt,
    largeImageKey: 'css',
    largeImageText: 'Counter-Strike: Source',
    smallImageText: player.personaname,
    instance: false
  });
}

export async function clearPresence(): Promise<void> {
  if (client && ready) await client.clearActivity();
}
