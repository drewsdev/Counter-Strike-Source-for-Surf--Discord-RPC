declare module 'discord-rpc' {
  interface Activity {
    details?: string;
    state?: string;
    startTimestamp?: number;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageText?: string;
    instance?: boolean;
  }

  export class Client {
    constructor(options: { transport: 'ipc' });
    on(event: 'ready' | 'disconnected', listener: () => void): void;
    login(options: { clientId: string }): Promise<void>;
    setActivity(activity: Activity): Promise<void>;
    clearActivity(): Promise<void>;
  }

  const RPC: { Client: typeof Client };
  export default RPC;
}