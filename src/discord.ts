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
    details: `Current map: ${server.map}`,
    state: `Server IP: ${player.gameserverip} | ${server.players}/${server.maxPlayers} players`,
    startTimestamp: startedAt,
    largeImageKey: 'css',
    largeImageText: server.name || 'Counter-Strike: Source',
    smallImageKey: process.env.DISCORD_SMALL_IMAGE_KEY ?? 'css_small',
    smallImageText: player.personaname,
    buttons: player.profileurl
      ? [{
          label: process.env.DISCORD_BUTTON_LABEL ?? 'View Steam Profile',
          url: player.profileurl
        }]
      : undefined,
    instance: false
  });
}

export async function clearPresence(): Promise<void> {
  if (client && ready) await client.clearActivity();
}
