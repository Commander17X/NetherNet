import type { Edition } from "@/lib/types";

export interface FeaturedServer {
  id: string;
  name: string;
  javaHost: string;
  javaPort: number;
  bedrockHost: string;
  description: string;
  tags: string[];
  defaultEdition: Edition;
}

/** Hardcoded featured server — matches relay/config/public-servers.json */
export const FEATURED_TRIX: FeaturedServer = {
  id: "trix-islands",
  name: "Trix Islands",
  javaHost: "play.trix-islands.gg",
  javaPort: 2788,
  bedrockHost: "play.trix-islands.gg",
  description:
    "Featured Java server — Bedrock players connect via NetherNet relay (SRV often points to port 2788).",
  tags: ["featured", "survival"],
  defaultEdition: "java",
};

export function featuredAsAddress(edition: Edition = "java"): string {
  const host = edition === "bedrock" ? FEATURED_TRIX.bedrockHost : FEATURED_TRIX.javaHost;
  const port = edition === "bedrock" ? 19132 : FEATURED_TRIX.javaPort;
  return `${host}:${port}`;
}