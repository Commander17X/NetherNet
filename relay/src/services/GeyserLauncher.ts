import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'yaml';
import type { GeyserProcessHandle, SessionRecord } from '../types';
import type { RelayConfig } from '../config';

export interface GeyserLauncher {
  start(session: SessionRecord): Promise<GeyserProcessHandle>;
  stop(handle: GeyserProcessHandle): Promise<void>;
}

export interface GeyserLauncherDeps {
  config: RelayConfig;
  execCommand?: (
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv },
  ) => Promise<{ stdout: string; stderr: string }>;
}

const running = new Map<string, { child?: ChildProcess; handle: GeyserProcessHandle }>();

function geyserConfigYaml(session: SessionRecord, publicHost: string): string {
  const floodgateEnabled = session.authMode === 'offline';
  return stringify({
    bedrock: {
      address: '0.0.0.0',
      port: session.bedrockPort,
      'clone-remote-port': false,
      motd: `NetherNet → ${session.javaHost}`,
    },
    remote: {
      address: session.javaHost,
      port: session.javaPort,
      'auth-type': session.authMode,
    },
    'passthrough-motd': true,
    'passthrough-player-counts': true,
    'forward-hostname': publicHost,
    floodgate: {
      'key-file-path': floodgateEnabled ? 'key.pem' : undefined,
    },
  });
}

export class DefaultGeyserLauncher implements GeyserLauncher {
  constructor(private readonly deps: GeyserLauncherDeps) {}

  async start(session: SessionRecord): Promise<GeyserProcessHandle> {
    const { config } = this.deps;
    await fs.mkdir(config.geyserSessionsDir, { recursive: true });
    const sessionDir = path.join(config.geyserSessionsDir, session.id);
    await fs.mkdir(sessionDir, { recursive: true });
    const configPath = path.join(sessionDir, 'config.yml');
    await fs.writeFile(configPath, geyserConfigYaml(session, config.publicHost), 'utf8');

    if (config.geyserMode === 'docker') {
      return this.startDocker(session, configPath);
    }
    return this.startStandalone(session, configPath, sessionDir);
  }

  private async startStandalone(
    session: SessionRecord,
    configPath: string,
    cwd: string,
  ): Promise<GeyserProcessHandle> {
    const child = spawn(
      process.env.JAVA_HOME
        ? path.join(process.env.JAVA_HOME, 'bin', 'java')
        : 'java',
      ['-jar', this.deps.config.geyserJarPath, '--config', configPath],
      { cwd, stdio: 'ignore', detached: false },
    );

    const handle: GeyserProcessHandle = {
      sessionId: session.id,
      mode: 'standalone',
      pid: child.pid,
      configPath,
    };
    running.set(session.id, { child, handle });

    child.on('exit', () => {
      running.delete(session.id);
    });

    return handle;
  }

  private async startDocker(
    session: SessionRecord,
    configPath: string,
  ): Promise<GeyserProcessHandle> {
    const exec = this.deps.execCommand ?? defaultExec;
    const containerName = `nethernet-geyser-${session.id.slice(0, 8)}`;
    const sessionDir = path.dirname(configPath);

    await exec('docker', [
      'run',
      '-d',
      '--name',
      containerName,
      '-p',
      `${session.bedrockPort}:${session.bedrockPort}/udp`,
      '-v',
      `${sessionDir}:/config`,
      'ghcr.io/geysermc/geyser:latest',
    ]);

    const inspect = await exec('docker', ['inspect', '-f', '{{.Id}}', containerName]);
    const containerId = inspect.stdout.trim();

    const handle: GeyserProcessHandle = {
      sessionId: session.id,
      mode: 'docker',
      containerId,
      configPath,
    };
    running.set(session.id, { handle });
    return handle;
  }

  async stop(handle: GeyserProcessHandle): Promise<void> {
    const entry = running.get(handle.sessionId);
    running.delete(handle.sessionId);

    if (handle.mode === 'docker') {
      const exec = this.deps.execCommand ?? defaultExec;
      const name = `nethernet-geyser-${handle.sessionId.slice(0, 8)}`;
      try {
        await exec('docker', ['rm', '-f', name]);
      } catch {
        /* ignore cleanup errors */
      }
      return;
    }

    const child = entry?.child;
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }
}

async function defaultExec(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code}: ${stderr}`));
    });
  });
}

/** In-memory launcher for tests — records starts/stops without spawning processes. */
export class FakeGeyserLauncher implements GeyserLauncher {
  readonly started: SessionRecord[] = [];
  readonly stopped: string[] = [];
  private readonly handles = new Map<string, GeyserProcessHandle>();

  constructor(private readonly publicHost = 'test.local') {}

  async start(session: SessionRecord): Promise<GeyserProcessHandle> {
    this.started.push({ ...session });
    const handle: GeyserProcessHandle = {
      sessionId: session.id,
      mode: 'standalone',
      pid: 424242,
      configPath: `/fake/${session.id}/config.yml`,
    };
    this.handles.set(session.id, handle);
    return handle;
  }

  async stop(handle: GeyserProcessHandle): Promise<void> {
    this.stopped.push(handle.sessionId);
    this.handles.delete(handle.sessionId);
  }

  getHandle(id: string): GeyserProcessHandle | undefined {
    return this.handles.get(id);
  }
}