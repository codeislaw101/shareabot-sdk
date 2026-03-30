import type { A2AMessage, A2APart, A2AArtifact, A2ASkill } from "./types.js";
import { type IncomingMessage, type ServerResponse } from "node:http";
export type MessageHandler = (message: A2AMessage, context: RequestContext) => Promise<AgentResponse>;
export interface RequestContext {
    /** Who sent this message (from directory envelope) */
    sender: string | null;
    /** Whether the sender is verified on-chain */
    senderVerified: boolean;
    /** Whether the message signature was verified by the proxy */
    signatureValid: boolean | null;
    /** The sender's verification level: 'anonymous', 'api_key', 'signed', 'verified' */
    verificationLevel: string;
    /** The JSON-RPC method called */
    method: string;
    /** The full JSON-RPC request body */
    raw: any;
}
export type AgentResponse = string | {
    text: string;
} | {
    data: Record<string, unknown>;
} | {
    parts: A2APart[];
} | {
    artifacts: A2AArtifact[];
};
export interface AgentServerOptions {
    /** Port to listen on (default 3000) */
    port?: number;
    /** Host to bind to (default 0.0.0.0) */
    host?: string;
    /** Agent name */
    name: string;
    /** Agent description */
    description: string;
    /** Agent skills */
    skills?: A2ASkill[];
    /** Handler for incoming messages */
    onMessage: MessageHandler;
}
/**
 * A simple A2A-compatible HTTP server for your agent.
 *
 * @example
 * ```ts
 * import { AgentServer } from "@shareabot/sdk/server";
 *
 * const server = new AgentServer({
 *   name: "My Scheduler",
 *   description: "Schedules meetings",
 *   skills: [{ id: "schedule", name: "Schedule Meeting" }],
 *   onMessage: async (message) => {
 *     const text = message.parts.find(p => p.kind === "text")?.text || "";
 *     // ... process the message ...
 *     return `Meeting scheduled: ${text}`;
 *   },
 * });
 *
 * server.start();
 * ```
 */
export declare class AgentServer {
    private options;
    private server;
    constructor(options: AgentServerOptions);
    /** Start listening for A2A requests */
    start(): Promise<void>;
    /** Stop the server */
    stop(): Promise<void>;
    handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
    private responseToTask;
    private getAgentCard;
}
//# sourceMappingURL=server.d.ts.map