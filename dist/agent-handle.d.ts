import type { A2AMessage, A2ATask, AgentCard, DirectoryEntry, SendOptions, PricingInfo } from "./types.js";
/**
 * A handle to a discovered agent. Use this to send A2A messages.
 *
 * @example
 * ```ts
 * const uber = await directory.find("ride booking");
 * const result = await uber.send("Book me a ride to the airport");
 * console.log(result.text);
 * ```
 */
export declare class AgentHandle {
    readonly handle: string;
    readonly card: AgentCard;
    readonly entry: DirectoryEntry;
    private baseUrl;
    private headers;
    private timeout;
    private signingKey;
    constructor(entry: DirectoryEntry, baseUrl: string, headers: Record<string, string>, timeout: number, signingKey?: string);
    /** Agent's display name */
    get name(): string;
    /** Agent's description */
    get description(): string;
    /** Whether the agent is verified on-chain */
    get isVerified(): boolean;
    /** Agent's current health status */
    get status(): string;
    /** Agent's declared skills */
    get skills(): string[];
    /** Whether this agent charges per message */
    get isPaid(): boolean;
    /** Price per message in SHAB (0 if free) */
    get pricePerMessage(): number;
    /** Full pricing info (null if free) */
    get pricing(): PricingInfo | null;
    /**
     * Send a text message to this agent and get a response.
     * For paid agents, include opts.taskId referencing an on-chain escrow deposit.
     *
     * @example
     * ```ts
     * // Free agent
     * const result = await agent.send("Schedule a meeting with Bob");
     *
     * // Paid agent (deposit SHAB into escrow first, then pass the taskId)
     * const result = await agent.send("Schedule a meeting", { taskId: 42 });
     * ```
     */
    send(text: string, opts?: SendOptions): Promise<AgentResult>;
    /**
     * Send structured data to this agent.
     *
     * @example
     * ```ts
     * const result = await agent.sendData({
     *   action: "book_ride",
     *   pickup: "123 Main St",
     *   dropoff: "SFO Airport",
     *   time: "now"
     * });
     * ```
     */
    sendData(data: Record<string, unknown>, opts?: SendOptions): Promise<AgentResult>;
    /**
     * Send a full A2A message (advanced usage).
     * For paid agents, include opts.taskId referencing an on-chain escrow deposit.
     */
    sendMessage(message: A2AMessage, opts?: SendOptions): Promise<AgentResult>;
    toString(): string;
}
/**
 * The result of sending a message to an agent.
 */
export declare class AgentResult {
    readonly task: A2ATask;
    readonly agentHandle: string;
    constructor(task: A2ATask, agentHandle: string);
    /** The task status: completed, working, failed, etc. */
    get status(): string;
    /** Whether the task completed successfully */
    get ok(): boolean;
    /** Extract all text from the response artifacts */
    get text(): string;
    /** Extract all data objects from the response artifacts */
    get data(): Record<string, unknown>[];
    /** Get the full artifacts array */
    get artifacts(): import("./types.js").A2AArtifact[];
    toString(): string;
}
/**
 * Error from an agent interaction.
 */
export declare class AgentError extends Error {
    readonly code: number;
    readonly agentHandle: string;
    constructor(message: string, code: number, agentHandle: string);
}
//# sourceMappingURL=agent-handle.d.ts.map