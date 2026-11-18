import { randomUUID } from 'node:crypto';
import type { CreateSessionRequest, SessionRecord } from '../types';
import type { RelayConfig } from '../config';
import { PortPool } from './PortPool';
import type { GeyserLauncher } from './GeyserLauncher';
import type { GeyserProcessHandle } from '../types';
import { targetKey } from '../utils/targetKey';
import { isPrivateOrLocalHost } from '../utils/privateIp';

export class SessionManagerError extends Error {
  constructor(
    message: string,
    readonly code: 'VALIDATION' | 'POOL_EXHAUSTED' | 'NOT_FOUND' | 'PRIVATE_TARGET',
  ) {
    super(message);
    this.name = 'SessionManagerError';
  }
}

interface InternalSession {
  record: SessionRecord;
  handle: GeyserProcessHandle;
}

export class SessionManager {
  private readonly pool: PortPool;
  private readonly byId = new Map<string, InternalSession>();
  private readonly byTarget = new Map<string, string>();

  constructor(
    private readonly config: RelayConfig,
    private readonly launcher: GeyserLauncher,
  ) {
    this.pool = new PortPool(config.portPoolMin, config.portPoolMax);
  }

  list(): SessionRecord[] {
    return [...this.byId.values()].map((s) => s.record);
  }

  get(id: string): SessionRecord | undefined {
    return this.byId.get(id)?.record;
  }

  async create(body: CreateSessionRequest): Promise<SessionRecord> {
    const javaHost = body.javaHost?.trim();
    const javaPort = body.javaPort;
    const authMode = body.authMode ?? 'online';
    const reuse = body.reuse !== false;

    if (!javaHost) {
      throw new SessionManagerError('javaHost is required', 'VALIDATION');
    }
    if (
      typeof javaPort !== 'number' ||
      !Number.isInteger(javaPort) ||
      javaPort < 1 ||
      javaPort > 65535
    ) {
      throw new SessionManagerError('javaPort must be an integer 1-65535', 'VALIDATION');
    }
    if (authMode !== 'online' && authMode !== 'offline') {
      throw new SessionManagerError('authMode must be online or offline', 'VALIDATION');
    }

    if (!this.config.allowPrivateTargets && isPrivateOrLocalHost(javaHost)) {
      throw new SessionManagerError(
        'Target host is private or local; set ALLOW_PRIVATE_TARGETS=true to allow',
        'PRIVATE_TARGET',
      );
    }

    const key = targetKey(javaHost, javaPort, authMode);
    if (reuse) {
      const existingId = this.byTarget.get(key);
      if (existingId) {
        const existing = this.byId.get(existingId);
        if (existing) return existing.record;
      }
    }

    const bedrockPort = this.pool.allocate();
    if (bedrockPort === undefined) {
      throw new SessionManagerError('No free relay ports in pool', 'POOL_EXHAUSTED');
    }

    const id = randomUUID();
    const record: SessionRecord = {
      id,
      javaHost,
      javaPort,
      authMode,
      bedrockHost: this.config.publicHost,
      bedrockPort,
      publicHost: this.config.publicHost,
      createdAt: new Date().toISOString(),
      targetKey: key,
    };

    let handle: GeyserProcessHandle;
    try {
      handle = await this.launcher.start(record);
    } catch (err) {
      this.pool.release(bedrockPort);
      throw err;
    }

    this.byId.set(id, { record, handle });
    this.byTarget.set(key, id);
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const entry = this.byId.get(id);
    if (!entry) return false;

    await this.launcher.stop(entry.handle);

    this.byId.delete(id);
    if (this.byTarget.get(entry.record.targetKey) === id) {
      this.byTarget.delete(entry.record.targetKey);
    }
    this.pool.release(entry.record.bedrockPort);
    return true;
  }

  availablePorts(): number {
    return this.pool.availableCount();
  }
}