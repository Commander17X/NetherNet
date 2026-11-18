import type { Request, Response, NextFunction } from 'express';
import type { RelayConfig } from '../config';

export function createAuthMiddleware(config: RelayConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.apiToken) {
      next();
      return;
    }

    const header = req.header('authorization');
    const bearer =
      header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;
    const apiKey = req.header('x-api-token')?.trim();
    const token = bearer ?? apiKey;

    if (token !== config.apiToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}