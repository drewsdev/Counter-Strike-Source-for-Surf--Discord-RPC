import dgram from 'node:dgram';
import type { A2SInfo } from './types.js';

const A2S_INFO_REQUEST = Buffer.from('Source Engine Query\0', 'ascii');

function readCString(buffer: Buffer, offset: number): { value: string; next: number } {
  const end = buffer.indexOf(0, offset);
  if (end < 0) throw new Error('Malformed A2S response: missing string terminator.');
  return { value: buffer.toString('utf8', offset, end), next: end + 1 };
}

export async function queryA2SInfo(address: string, timeoutMs = 5000): Promise<A2SInfo> {
  const separator = address.lastIndexOf(':');
  const host = separator > 0 ? address.slice(0, separator) : address;
  const portText = separator > 0 ? address.slice(separator + 1) : '27015';
  const port = Number(portText);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid game server address: ${address}`);
  }

  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const timer = setTimeout(() => finish(new Error(`A2S_INFO timed out for ${address}.`)), timeoutMs);
    const finish = (error?: Error, info?: A2SInfo) => {
      clearTimeout(timer);
      socket.close();
      if (error) reject(error);
      else resolve(info as A2SInfo);
    };

    socket.once('error', (error) => finish(error));
    socket.once('message', (packet) => {
      try {
        if (packet.readInt32LE(0) !== -1 || packet[4] !== 0x49) {
          throw new Error('Unexpected A2S response header.');
        }
        let offset = 6;
        const nameResult = readCString(packet, offset); offset = nameResult.next;
        const mapResult = readCString(packet, offset); offset = mapResult.next;
        const folderResult = readCString(packet, offset); offset = folderResult.next;
        const gameResult = readCString(packet, offset); offset = gameResult.next;
        const appId = packet.readUInt16LE(offset); offset += 2;
        const players = packet[offset++];
        const maxPlayers = packet[offset++];
        const bots = packet[offset++];
        const serverType = String.fromCharCode(packet[offset++]);
        const environment = String.fromCharCode(packet[offset++]);
        const visibility = packet[offset++] !== 0;
        const vac = packet[offset++] !== 0;
        const version = readCString(packet, offset).value;
        finish(undefined, {
          name: nameResult.value,
          map: mapResult.value,
          folder: folderResult.value,
          game: gameResult.value,
          appId,
          players,
          maxPlayers,
          bots,
          serverType,
          environment,
          visibility,
          vac,
          version
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error('Could not parse A2S response.'));
      }
    });
    socket.send(A2S_INFO_REQUEST, port, host, (error) => {
      if (error) finish(error);
    });
  });
}
