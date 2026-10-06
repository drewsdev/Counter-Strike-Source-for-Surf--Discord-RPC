# Counter-Strike: Source Discord RPC

A small local Node.js service that connects a Steam account to Discord Rich Presence.

## Flow

1. The browser signs in through Steam OpenID.
2. The callback verifies the OpenID assertion server-to-server and extracts the SteamID64.
3. `GetPlayerSummaries` checks whether the account is playing Counter-Strike: Source and returns `gameserverip`.
4. The service sends a UDP `A2S_INFO` request to that address.
5. The server name, map, player count, and a locally tracked session start time are published to Discord.

## Requirements

- Node.js 20 or newer
- The Discord desktop client running locally
- A Steam Web API key from <https://steamcommunity.com/dev/apikey>
- A Discord application and its client ID from <https://discord.com/developers/applications>

## Setup

```sh
npm install
cp .env.example .env
```

Set `STEAM_API_KEY` and `DISCORD_CLIENT_ID` in `.env`. For local development, keep `PUBLIC_URL` as `http://localhost:3000` and start the service:

```sh
npm run dev
```

Open <http://localhost:3000/auth/steam> and complete the Steam login. The Steam OpenID realm and return URL must match the URL configured in the Steam Web API key settings. For a remote deployment, `PUBLIC_URL` must be an HTTPS URL reachable by the browser and the same URL must be registered with Steam.

## Build and run

```sh
npm run build
npm start
```

The service keeps sessions in memory, keyed by client IP. Restarting it logs everyone out. A2S does not expose the player's historical playtime, so the Discord elapsed timer starts when the observed game server changes.

## Notes

- `gameserverip` is only present while Steam reports the player as currently in a game.
- Counter-Strike: Source is identified by Steam app ID `240`.
- The current implementation targets IPv4 Source servers and the standard A2S_INFO response.
