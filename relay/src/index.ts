import { loadConfig } from './config';
import { createApp } from './app';
import { SessionManager } from './services/SessionManager';
import { DefaultGeyserLauncher } from './services/GeyserLauncher';

export function main(): void {
  const config = loadConfig();
  const launcher = new DefaultGeyserLauncher({ config });
  const sessionManager = new SessionManager(config, launcher);
  const app = createApp({ config, sessionManager });

  const server = app.listen(config.port, () => {
    console.log(
      `NetherNet relay listening on :${config.port} (PUBLIC_HOST=${config.publicHost}, geyser=${config.geyserMode})`,
    );
  });

  const shutdown = (): void => {
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main();
}