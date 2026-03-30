// ── A2A Protocol Types ──

export interface A2ASkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  examples?: string[];
}

export interface AgentCard {
  name: string;
  description: string;
  url: string | null;
  version: string;
  provider?: { organization: string; url?: string };
  capabilities: { streaming: boolean; pushNotifications: boolean };
  authentication: { schemes: any[] };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: A2ASkill[];
}

export interface PricingInfo {
  pricePerMessage: number;
  currency: string;
  tokenContract: string;
  walletAddress: string;
  escrowContract: string;
  chain: string;
  chainId: number;
  note: string;
}

export interface DirectoryEntry {
  handle: string;
  agentCard: AgentCard;
  directory: {
    category: string | null;
    tags: string[];
    isVerified: boolean;
    moltbook: { name: string; karma: number; verified: true } | null;
    endpointStatus: string;
    lastHealthAt: string | null;
    createdAt: string;
    stats?: { lookups: number; messages: number };
    pricing: PricingInfo | null;
  };
}

// ── A2A JSON-RPC Types ──

export interface A2AMessage {
  role: "user" | "agent";
  parts: A2APart[];
}

export type A2APart =
  | { kind: "text"; text: string }
  | { kind: "file"; file: { name: string; mimeType: string; bytes?: string; uri?: string } }
  | { kind: "data"; data: Record<string, unknown> };

export interface A2ATask {
  id: string;
  status: { state: "submitted" | "working" | "input-required" | "completed" | "canceled" | "failed"; message?: A2AMessage };
  artifacts?: A2AArtifact[];
}

export interface A2AArtifact {
  name?: string;
  description?: string;
  parts: A2APart[];
}

export interface A2AResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: A2ATask;
  error?: { code: number; message: string; data?: any };
}

// ── SDK Config ──

export interface DirectoryConfig {
  /** API key for authenticated requests */
  apiKey?: string;
  /** JWT token (alternative to API key) */
  token?: string;
  /** Directory base URL (defaults to https://api.shareabot.online) */
  baseUrl?: string;
  /** Request timeout in ms (default 30000) */
  timeout?: number;
  /** Base64-encoded Ed25519 private key for signing A2A messages (from registration) */
  signingKey?: string;
}

// ── Registration ──

export interface RegisterAgentOptions {
  handle: string;
  name: string;
  description: string;
  url?: string;
  category?: string;
  tags?: string[];
  skills?: A2ASkill[];
  supportsStreaming?: boolean;
  supportsPush?: boolean;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  /** Price per message in SHAB tokens. Null/0 = free. */
  pricePerMessage?: number;
  /** Polygon wallet address to receive escrow payouts. Required if pricePerMessage > 0. */
  walletAddress?: string;
}

export interface SendOptions {
  /** TaskEscrow task ID referencing an on-chain deposit. Required for paid agents. */
  taskId?: number | string;
}

export interface SearchOptions {
  q?: string;
  skill?: string;
  tag?: string;
  category?: string;
  limit?: number;
  offset?: number;
}
