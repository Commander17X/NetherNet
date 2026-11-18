import http from "node:http";

import type { PublicServer } from "./publicServers";
import { SessionManager } from "./sessions";

export type HealthReport = {
  ok: boolean;
  geyser: "ready" | "missing";
  java: "ready" | "missing";
  sessions: number;
  publicHost: string;
};

function send(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown);
      } catch {
        reject(new Error("Request body needs to be JSON."));
      }
    });
    req.on("error", reject);
  });
}

function authorized(req: http.IncomingMessage, token: string): boolean {
  if (!token) {
    return true;
  }
  const header = req.headers.authorization ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return presented === token;
}

export function createRelayServer(options: {
  sessions: SessionManager;
  publicServers: PublicServer[];
  token: string;
  health: () => HealthReport;
}): http.Server {
  return http.createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        send(res, 400, { error: "Bad request." });
        return;
      }
      if (req.method === "OPTIONS") {
        send(res, 204, {});
        return;
      }

      const url = new URL(req.url, "http://relay.local");
      const path = url.pathname;

      if (req.method === "GET" && path === "/") {
        send(res, 200, { name: "NetherNet relay", health: "/health", servers: "/servers" });
        return;
      }

      if (req.method === "GET" && path === "/health") {
        send(res, 200, options.health());
        return;
      }

      if (!authorized(req, options.token) && path !== "/health") {
        send(res, 401, { error: "Relay token was missing or wrong." });
        return;
      }

      if (req.method === "GET" && path === "/servers") {
        send(res, 200, { servers: options.publicServers });
        return;
      }

      if (req.method === "POST" && path === "/sessions") {
        const body = await readBody(req);
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          send(res, 400, { error: "Session body needs to be a JSON object." });
          return;
        }
        try {
          const session = await options.sessions.create(body as Record<string, unknown>);
          send(res, 202, session);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Couldn't open a session.";
          const status = /limit|ports/i.test(message) ? 503 : 400;
          send(res, status, { error: message });
        }
        return;
      }

      const sessionMatch = path.match(/^\/sessions\/([^/]+)$/);
      if (sessionMatch && req.method === "GET") {
        const session = options.sessions.get(decodeURIComponent(sessionMatch[1]));
        if (!session) {
          send(res, 404, { error: "No session with that id." });
          return;
        }
        options.sessions.keepAlive(session.id);
        send(res, 200, session);
        return;
      }

      if (sessionMatch && req.method === "DELETE") {
        const session = await options.sessions.stop(decodeURIComponent(sessionMatch[1]));
        if (!session) {
          send(res, 404, { error: "No session with that id." });
          return;
        }
        send(res, 200, session);
        return;
      }

      send(res, 404, { error: "Not found." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Relay error.";
      if (!res.headersSent) {
        send(res, 400, { error: message });
      } else {
        res.end();
      }
    }
  });
}
