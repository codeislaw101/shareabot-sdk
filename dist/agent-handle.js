import { signPayload } from "./signing.js";
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
export class AgentHandle {
    handle;
    card;
    entry;
    baseUrl;
    headers;
    timeout;
    signingKey;
    constructor(entry, baseUrl, headers, timeout, signingKey) {
        this.entry = entry;
        this.handle = entry.handle;
        this.card = entry.agentCard;
        this.baseUrl = baseUrl;
        this.headers = headers;
        this.timeout = timeout;
        this.signingKey = signingKey || null;
    }
    /** Agent's display name */
    get name() {
        return this.card.name;
    }
    /** Agent's description */
    get description() {
        return this.card.description;
    }
    /** Whether the agent is verified on-chain */
    get isVerified() {
        return this.entry.directory.isVerified;
    }
    /** Agent's current health status */
    get status() {
        return this.entry.directory.endpointStatus;
    }
    /** Agent's declared skills */
    get skills() {
        return this.card.skills.map((s) => s.name || s.id);
    }
    /** Whether this agent charges per message */
    get isPaid() {
        const p = this.entry.directory.pricing;
        return p != null && p.pricePerMessage > 0;
    }
    /** Price per message in SHAB (0 if free) */
    get pricePerMessage() {
        return this.entry.directory.pricing?.pricePerMessage ?? 0;
    }
    /** Full pricing info (null if free) */
    get pricing() {
        return this.entry.directory.pricing;
    }
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
    async send(text, opts) {
        return this.sendMessage({
            role: "user",
            parts: [{ kind: "text", text }],
        }, opts);
    }
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
    async sendData(data, opts) {
        return this.sendMessage({
            role: "user",
            parts: [{ kind: "data", data }],
        }, opts);
    }
    /**
     * Send a full A2A message (advanced usage).
     * For paid agents, include opts.taskId referencing an on-chain escrow deposit.
     */
    async sendMessage(message, opts) {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const body = {
            jsonrpc: "2.0",
            method: "message/send",
            id,
            params: {
                message,
                ...(opts?.taskId != null ? { taskId: opts.taskId } : {}),
            },
        };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        // Sign the payload if a signing key is configured
        const requestHeaders = { ...this.headers, "Content-Type": "application/json" };
        if (this.signingKey) {
            requestHeaders["X-Signature"] = signPayload(body, this.signingKey);
        }
        try {
            const res = await fetch(`${this.baseUrl}/directory/${this.handle}/a2a`, {
                method: "POST",
                headers: requestHeaders,
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const raw = await res.text();
            if (!res.ok) {
                let errorMsg = `Agent responded with ${res.status}`;
                try {
                    const parsed = JSON.parse(raw);
                    errorMsg = parsed.error?.message || parsed.message || errorMsg;
                }
                catch { }
                throw new AgentError(errorMsg, res.status, this.handle);
            }
            const response = JSON.parse(raw);
            if (response.error) {
                throw new AgentError(response.error.message, response.error.code, this.handle);
            }
            return new AgentResult(response.result, this.handle);
        }
        catch (err) {
            if (err instanceof AgentError)
                throw err;
            if (err.name === "AbortError") {
                throw new AgentError(`Request to @${this.handle} timed out after ${this.timeout}ms`, 408, this.handle);
            }
            throw new AgentError(`Failed to reach @${this.handle}: ${err.message}`, 0, this.handle);
        }
        finally {
            clearTimeout(timer);
        }
    }
    toString() {
        return `@${this.handle} (${this.card.name})`;
    }
}
/**
 * The result of sending a message to an agent.
 */
export class AgentResult {
    task;
    agentHandle;
    constructor(task, agentHandle) {
        this.task = task;
        this.agentHandle = agentHandle;
    }
    /** The task status: completed, working, failed, etc. */
    get status() {
        return this.task.status.state;
    }
    /** Whether the task completed successfully */
    get ok() {
        return this.task.status.state === "completed";
    }
    /** Extract all text from the response artifacts */
    get text() {
        if (!this.task.artifacts)
            return "";
        return this.task.artifacts
            .flatMap((a) => a.parts)
            .filter((p) => p.kind === "text")
            .map((p) => p.text)
            .join("\n");
    }
    /** Extract all data objects from the response artifacts */
    get data() {
        if (!this.task.artifacts)
            return [];
        return this.task.artifacts
            .flatMap((a) => a.parts)
            .filter((p) => p.kind === "data")
            .map((p) => p.data);
    }
    /** Get the full artifacts array */
    get artifacts() {
        return this.task.artifacts || [];
    }
    toString() {
        return this.text || `[${this.status}]`;
    }
}
/**
 * Error from an agent interaction.
 */
export class AgentError extends Error {
    code;
    agentHandle;
    constructor(message, code, agentHandle) {
        super(message);
        this.name = "AgentError";
        this.code = code;
        this.agentHandle = agentHandle;
    }
}
//# sourceMappingURL=agent-handle.js.map