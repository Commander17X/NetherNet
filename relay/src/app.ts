import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import type { RelayConfig } from './config';
import { createAuthMiddleware } from './middleware/auth';
import { SessionManager, SessionManagerError } from './services/SessionManager';
import type { CreateSessionRequest, PublicServersConfig } from './types';

export interface AppDeps {
  config: RelayConfig;
  sessionManager: SessionManager;
}

export function createApp(deps: AppDeps): Express {
  const { config, sessionManager } = deps;
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      publicHost: config.publicHost,
      freePorts: sessionManager.availablePorts(),
      geyserMode: config.geyserMode,
    });
  });

  app.get('/servers', (_req, res) => {
    try {
      const raw = fs.readFileSync(config.publicServersPath, 'utf8');
      const data = JSON.parse(raw) as PublicServersConfig;
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Failed to load public servers catalog' });
    }
  });

  const authed = createAuthMiddleware(config);

  app.post('/v1/sessions', authed, async (req: Request, res: Response) => {
    try {
      const body = req.body as CreateSessionRequest;
      const session = await sessionManager.create(body);
      res.status(201).json(session);
    } catch (err) {
      mapSessionError(err, res);
    }
  });

  app.get('/v1/sessions/:id', authed, (req: Request, res: Response) => {
    const session = sessionManager.get(String(req.params.id));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  });

  app.delete('/v1/sessions/:id', authed, async (req: Request, res: Response) => {
    try {
      const removed = await sessionManager.delete(String(req.params.id));
      if (!removed) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      mapSessionError(err, res);
    }
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

function mapSessionError(err: unknown, res: Response): void {
  if (err instanceof SessionManagerError) {
    const status =
      err.code === 'VALIDATION' || err.code === 'PRIVATE_TARGET'
        ? 400
        : err.code === 'POOL_EXHAUSTED'
          ? 503
          : err.code === 'NOT_FOUND'
            ? 404
            : 400;
    res.status(status).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}