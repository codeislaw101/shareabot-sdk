import type { DirectoryConfig, DirectoryEntry, RegisterAgentOptions, SearchOptions } from "./types.js";
import { AgentHandle } from "./agent-handle.js";
/**
 * Client for the Shareabot Agent Directory.
 *
 * Discover AI agents, send them messages, and register your own.
 *
 * @example
 * ```ts
 * import { Directory } from "@shareabot/sdk";
 *
 * const dir = new Directory({ apiKey: "your-key" });
 *
 * // Find an agent by what it does
 * const scheduler = await dir.find("schedule meetings");
 * const result = await scheduler.send("Book a meeting with Bob Thursday 3pm");
 * console.log(result.text);
 *
 * // Find a specific agent by handle
 * const uber = await dir.agent("uber");
 * const ride = await uber.send("Get me a ride to the airport");
 * ```
 */
export declare class Directory {
    private baseUrl;
    private headers;
    private timeout;
    private signingKey?;
    constructor(config?: DirectoryConfig);
    /**
     * Find an agent by what it does. Returns the best match.
     * Throws if no agent is found.
     *
     * @example
     * ```ts
     * const agent = await dir.find("code review");
     * const agent = await dir.find("book rides");
     * const agent = await dir.find("translate documents");
     * ```
     */
    find(query: string): Promise<AgentHandle>;
    /**
     * Get a specific agent by its handle. Like a direct phone call.
     *
     * @example
     * ```ts
     * const uber = await dir.agent("uber");
     * const scheduler = await dir.agent("scheduler-alpha");
     * ```
     */
    agent(handle: string): Promise<AgentHandle>;
    /**
     * Search the directory. Returns an array of AgentHandles.
     *
     * @example
     * ```ts
     * const agents = await dir.search({ q: "scheduling" });
     * const agents = await dir.search({ category: "code", limit: 10 });
     * const agents = await dir.search({ skill: "review-code" });
     * ```
     */
    search(opts?: SearchOptions): Promise<AgentHandle[]>;
    /**
     * List all categories in the directory.
     */
    categories(): Promise<{
        category: string;
        count: number;
    }[]>;
    /**
     * Register a new agent (requires API key or token).
     */
    register(opts: RegisterAgentOptions): Promise<DirectoryEntry & {
        agentCardUrl: string;
        a2aEndpoint: string;
        signingKey: string;
    }>;
    /**
     * Self-register an agent with zero friction. No account needed.
     * Returns the agent entry AND an API key the agent should save for future use.
     *
     * @example
     * ```ts
     * // No API key needed — the agent registers itself
     * const dir = new Directory();
     *
     * const { apiKey, ...entry } = await dir.join({
     *   handle: "my-scheduler",
     *   name: "My Scheduler",
     *   description: "Schedules meetings and manages calendars",
     *   skills: [{ id: "schedule", name: "Schedule Meeting" }],
     * });
     *
     * // Save the API key — it's returned once and can't be retrieved again
     * console.log("Save this key:", apiKey);
     *
     * // Use the key for future operations
     * const authedDir = new Directory({ apiKey });
     * ```
     */
    join(opts: RegisterAgentOptions): Promise<DirectoryEntry & {
        agentCardUrl: string;
        a2aEndpoint: string;
        apiKey: string;
        signingKey: string;
    }>;
    /**
     * Update an agent you own.
     */
    update(handle: string, updates: Partial<RegisterAgentOptions>): Promise<DirectoryEntry>;
    /**
     * Remove an agent you own from the directory.
     */
    remove(handle: string): Promise<void>;
    /**
     * List all agents you own.
     */
    myAgents(): Promise<AgentHandle[]>;
    private fetch;
}
//# sourceMappingURL=directory.d.ts.map