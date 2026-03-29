import type { A2AMessage, A2APart, A2AResponse, A2ATask, AgentCard, DirectoryEntry, SendOptions, PricingInfo } from "./types.js";

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
  readonly handle: string;
  readonly card: AgentCard;
  readonly entry: DirectoryEntry;

  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(entry: DirectoryEntry, baseUrl: string, headers: Record<string, string>, timeout: number) {
    this.entry = entry;
    this.handle = entry.handle;
    this.card = entry.agentCard;
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.timeout = timeout;
  }

  /** Agent's display name */
  get name(): string {
    return this.card.name;
  }

  /** Agent's description */
  get description(): string {
    return this.card.description;
  }

  /** Whether the agent is verified on-chain */
  get isVerified(): boolean {
    return this.entry.directory.isVerified;
  }

  /** Agent's current health status */
  get status(): string {
    return this.entry.directory.endpointStatus;
  }

  /** Agent's declared skills */
  get skills(): string[] {
    return this.card.skills.map((s) => s.name || s.id);
  }

  /** Whether this agent charges per message */
  get isPaid(): boolean {
    const p = this.entry.directory.pricing;
    return p != null && p.pricePerMessage > 0;
  }

  /** Price per message in SHAB (0 if free) */
  get pricePerMessage(): number {
    return this.entry.directory.pricing?.pricePerMessage ?? 0;
  }

  /** Full pricing info (null if free) */
  get pricing(): PricingInfo | null {
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
  async send(text: string, opts?: SendOptions): Promise<AgentResult> {
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
  async sendData(data: Record<string, unknown>, opts?: SendOptions): Promise<AgentResult> {
    return this.sendMessage({
      role: "user",
      parts: [{ kind: "data", data }],
    }, opts);
  }

  /**
   * Send a full A2A message (advanced usage).
   * For paid agents, include opts.taskId referencing an on-chain escrow deposit.
   */
  async sendMessage(message: A2AMessage, opts?: SendOptions): Promise<AgentResult> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const body = {
      jsonrpc: "2.0" as const,
      method: "message/send",
      id,
      params: {
        message,
        ...(opts?.taskId != null ? { taskId: opts.taskId } : {}),
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/directory/${this.handle}/a2a`, {
        method: "POST",
        headers: { ...this.headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw = await res.text();

      if (!res.ok) {
        let errorMsg = `Agent responded with ${res.status}`;
        try {
          const parsed = JSON.parse(raw);
          errorMsg = parsed.error?.message || parsed.message || errorMsg;
        } catch {}
        throw new AgentError(errorMsg, res.status, this.handle);
      }

      const response: A2AResponse = JSON.parse(raw);

      if (response.error) {
        throw new AgentError(response.error.message, response.error.code, this.handle);
      }

      return new AgentResult(response.result!, this.handle);
    } catch (err: any) {
      if (err instanceof AgentError) throw err;
      if (err.name === "AbortError") {
        throw new AgentError(`Request to @${this.handle} timed out after ${this.timeout}ms`, 408, this.handle);
      }
      throw new AgentError(`Failed to reach @${this.handle}: ${err.message}`, 0, this.handle);
    } finally {
      clearTimeout(timer);
    }
  }

  toString(): string {
    return `@${this.handle} (${this.card.name})`;
  }
}

/**
 * The result of sending a message to an agent.
 */
export class AgentResult {
  readonly task: A2ATask;
  readonly agentHandle: string;

  constructor(task: A2ATask, agentHandle: string) {
    this.task = task;
    this.agentHandle = agentHandle;
  }

  /** The task status: completed, working, failed, etc. */
  get status(): string {
    return this.task.status.state;
  }

  /** Whether the task completed successfully */
  get ok(): boolean {
    return this.task.status.state === "completed";
  }

  /** Extract all text from the response artifacts */
  get text(): string {
    if (!this.task.artifacts) return "";
    return this.task.artifacts
      .flatMap((a) => a.parts)
      .filter((p): p is Extract<A2APart, { kind: "text" }> => p.kind === "text")
      .map((p) => p.text)
      .join("\n");
  }

  /** Extract all data objects from the response artifacts */
  get data(): Record<string, unknown>[] {
    if (!this.task.artifacts) return [];
    return this.task.artifacts
      .flatMap((a) => a.parts)
      .filter((p): p is Extract<A2APart, { kind: "data" }> => p.kind === "data")
      .map((p) => p.data);
  }

  /** Get the full artifacts array */
  get artifacts() {
    return this.task.artifacts || [];
  }

  toString(): string {
    return this.text || `[${this.status}]`;
  }
}

/**
 * Error from an agent interaction.
 */
export class AgentError extends Error {
  readonly code: number;
  readonly agentHandle: string;

  constructor(message: string, code: number, agentHandle: string) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.agentHandle = agentHandle;
  }
}
