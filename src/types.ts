export interface SteamPlayer {
  steamid: string;
  personaname: string;
  profileurl?: string;
  avatarfull?: string;
  personastate?: number;
  gameid?: string;
  gameextrainfo?: string;
  gameserverip?: string;
}

export interface A2SInfo {
  name: string;
  map: string;
  folder: string;
  game: string;
  appId: number;
  players: number;
  maxPlayers: number;
  bots: number;
  serverType: string;
  environment: string;
  visibility: boolean;
  vac: boolean;
  version: string;
}
