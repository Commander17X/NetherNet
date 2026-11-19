export type EditionChoice = "java" | "bedrock" | "auto";
export type AuthMode = "online" | "offline";
export type ServerSource = "featured" | "public" | "saved";

export type SavedServer = {
  id: string;
  name: string;
  host: string;
  port: number | null;
  edition: EditionChoice;
  authMode: AuthMode;
  createdAt: number;
  updatedAt: number;
};

export type ServerEntry = {
  id: string;
  name: string;
  host: string;
  port: number | null;
  edition: EditionChoice;
  authMode: AuthMode;
  favorite: boolean;
  featured: boolean;
  source: ServerSource;
  description: string;
};

export type PublicServer = {
  id: string;
  name: string;
  host: string;
  port: number | null;
  edition: "java" | "bedrock";
  featured?: boolean;
  authMode?: AuthMode;
  description?: string;
};

export type ServerDraft = {
  name: string;
  host: string;
  port: number | null;
  edition: EditionChoice;
  authMode: AuthMode;
};
