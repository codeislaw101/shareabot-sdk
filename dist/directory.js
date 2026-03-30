import { AgentHandle } from "./agent-handle.js";
const DEFAULT_BASE_URL = "https://api.shareabot.online";
const DEFAULT_TIMEOUT = 30_000;
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
export class Directory {
    baseUrl;
    headers;
    timeout;
    signingKey;
    constructor(config = {}) {
        this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
        this.timeout = config.timeout || DEFAULT_TIMEOUT;
        this.signingKey = config.signingKey;
        this.headers = {};
        if (config.apiKey) {
            this.headers["X-API-Key"] = config.apiKey;
        }
        else if (config.token) {
            this.headers["Authorization"] = `Bearer ${config.token}`;
        }
    }
    // ─── Discovery ──────────────────────────────────────────────
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
    async find(query) {
        const results = await this.search({ q: query, limit: 1 });
        if (results.length === 0) {
            throw new Error(`No agent found for "${query}"`);
        }
        return results[0];
    }
    /**
     * Get a specific agent by its handle. Like a direct phone call.
     *
     * @example
     * ```ts
     * const uber = await dir.agent("uber");
     * const scheduler = await dir.agent("scheduler-alpha");
     * ```
     */
    async agent(handle) {
        const res = await this.fetch(`/directory/${encodeURIComponent(handle)}`);
        if (!res.ok) {
            if (res.status === 404)
                throw new Error(`Agent @${handle} not found`);
            throw new Error(`Failed to get agent @${handle}: ${res.status}`);
        }
        const entry = await res.json();
        return new AgentHandle(entry, this.baseUrl, this.headers, this.timeout, this.signingKey);
    }
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
    async search(opts = {}) {
        const params = new URLSearchParams();
        if (opts.q)
            params.set("q", opts.q);
        if (opts.skill)
            params.set("skill", opts.skill);
        if (opts.tag)
            params.set("tag", opts.tag);
        if (opts.category)
            params.set("category", opts.category);
        if (opts.limit)
            params.set("limit", String(opts.limit));
        if (opts.offset)
            params.set("offset", String(opts.offset));
        const qs = params.toString();
        const res = await this.fetch(`/directory/search${qs ? `?${qs}` : ""}`);
        if (!res.ok)
            throw new Error(`Search failed: ${res.status}`);
        const entries = await res.json();
        return entries.map((e) => new AgentHandle(e, this.baseUrl, this.headers, this.timeout));
    }
    /**
     * List all categories in the directory.
     */
    async categories() {
        const res = await this.fetch("/directory/browse");
        if (!res.ok)
            throw new Error(`Browse failed: ${res.status}`);
        return res.json();
    }
    // ─── Registration ───────────────────────────────────────────
    /**
     * Register a new agent (requires API key or token).
     */
    async register(opts) {
        const res = await this.fetch("/directory/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(opts),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Registration failed: ${res.status}`);
        }
        return res.json();
    }
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
    async join(opts) {
        const res = await this.fetch("/directory/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(opts),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Registration failed: ${res.status}`);
        }
        return res.json();
    }
    /**
     * Update an agent you own.
     */
    async update(handle, updates) {
        const res = await this.fetch(`/directory/${encodeURIComponent(handle)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Update failed: ${res.status}`);
        }
        return res.json();
    }
    /**
     * Remove an agent you own from the directory.
     */
    async remove(handle) {
        const res = await this.fetch(`/directory/${encodeURIComponent(handle)}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Delete failed: ${res.status}`);
        }
    }
    /**
     * List all agents you own.
     */
    async myAgents() {
        const res = await this.fetch("/directory/my/agents");
        if (!res.ok)
            throw new Error(`Failed to list agents: ${res.status}`);
        const entries = await res.json();
        return entries.map((e) => new AgentHandle(e, this.baseUrl, this.headers, this.timeout));
    }
    // ─── Internal ───────────────────────────────────────────────
    fetch(path, init = {}) {
        const headers = { ...this.headers, ...(init.headers || {}) };
        return fetch(`${this.baseUrl}${path}`, { ...init, headers });
    }
}
//# sourceMappingURL=directory.js.map