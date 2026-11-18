import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import type { RelayConfig } from '../src/config';
import { createApp } from '../src/app';
import { SessionManager } from '../src/services/SessionManager';
import { FakeGeyserLauncher } from '../src/services/GeyserLauncher';

function testConfig(overrides: Partial<RelayConfig> = {}): RelayConfig {
  const publicServersPath = path.join(__dirname, '..', 'config', 'public-servers.json');
  return {
    publicHost: 'relay.example.com',
    apiToken: undefined,
    port: 8787,
    geyserMode: 'standalone',
    geyserJarPath: '/nonexistent/geyser.jar',
    geyserSessionsDir: path.join(__dirname, '..', '.geyser-sessions-test'),
    portPoolMin: 19132,
    portPoolMax: 19140,
    rateLimitWindowMs: 60_000,
    rateLimitMax: 10_000,
    allowPrivateTargets: false,
    publicServersPath,
    ...overrides,
  };
}

describe('Relay HTTP API', () => {
  const launcher = new FakeGeyserLauncher('relay.example.com');

  afterEach(async () => {
    launcher.started.length = 0;
    launcher.stopped.length = 0;
  });

  function buildApp(token?: string) {
    const config = testConfig({ apiToken: token });
    const manager = new SessionManager(config, launcher);
    return { app: createApp({ config, sessionManager: manager }), manager, config };
  }

  it('GET /health returns status and pool info', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.publicHost).toBe('relay.example.com');
    expect(res.body.freePorts).toBeGreaterThan(0);
  });

  it('GET /servers lists featured play.trix-islands.gg', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/servers');
    expect(res.status).toBe(200);
    expect(res.body.featured.javaHost).toBe('play.trix-islands.gg');
    expect(res.body.servers[0].javaPort).toBe(2788);
  });

  it('POST /v1/sessions creates a session and starts fake Geyser', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: 'play.trix-islands.gg', javaPort: 2788, authMode: 'online' });
    expect(res.status).toBe(201);
    expect(res.body.bedrockHost).toBe('relay.example.com');
    expect(res.body.bedrockPort).toBeGreaterThanOrEqual(19132);
    expect(launcher.started).toHaveLength(1);
  });

  it('reuses session for the same target', async () => {
    const { app } = buildApp();
    const first = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: 'play.trix-islands.gg', javaPort: 2788 });
    const second = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: 'play.trix-islands.gg', javaPort: 2788 });
    expect(first.body.id).toBe(second.body.id);
    expect(launcher.started).toHaveLength(1);
  });

  it('blocks private targets unless ALLOW_PRIVATE_TARGETS', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: '192.168.1.10', javaPort: 25565 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PRIVATE_TARGET');
  });

  it('allows private targets when configured', async () => {
    const config = testConfig({ allowPrivateTargets: true });
    const manager = new SessionManager(config, launcher);
    const app = createApp({ config, sessionManager: manager });
    const res = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: '10.0.0.5', javaPort: 25565 });
    expect(res.status).toBe(201);
  });

  it('requires API token when RELAY_API_TOKEN is set', async () => {
    const { app } = buildApp('secret-token');
    const denied = await request(app).post('/v1/sessions').send({ javaHost: 'mc.hypixel.net', javaPort: 25565 });
    expect(denied.status).toBe(401);
    const ok = await request(app)
      .post('/v1/sessions')
      .set('Authorization', 'Bearer secret-token')
      .send({ javaHost: 'mc.hypixel.net', javaPort: 25565 });
    expect(ok.status).toBe(201);
  });

  it('GET and DELETE /v1/sessions/:id', async () => {
    const { app } = buildApp();
    const created = await request(app)
      .post('/v1/sessions')
      .send({ javaHost: 'example.net', javaPort: 25565 });
    const id = created.body.id;
    const getRes = await request(app).get(`/v1/sessions/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(id);
    const delRes = await request(app).delete(`/v1/sessions/${id}`);
    expect(delRes.status).toBe(204);
    expect(launcher.stopped).toContain(id);
    const missing = await request(app).get(`/v1/sessions/${id}`);
    expect(missing.status).toBe(404);
  });
});

describe('private IP helper', () => {
  const { isPrivateOrLocalHost } = require('../src/utils/privateIp');
  it('detects loopback and RFC1918', () => {
    expect(isPrivateOrLocalHost('127.0.0.1')).toBe(true);
    expect(isPrivateOrLocalHost('10.1.2.3')).toBe(true);
    expect(isPrivateOrLocalHost('play.trix-islands.gg')).toBe(false);
  });
});