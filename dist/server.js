import { createServer } from "node:http";
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
export class AgentServer {
    options;
    server = null;
    constructor(options) {
        this.options = {
            port: 3000,
            host: "0.0.0.0",
            ...options,
        };
    }
    /** Start listening for A2A requests */
    start() {
        return new Promise((resolve) => {
            this.server = createServer((req, res) => this.handleRequest(req, res));
            this.server.listen(this.options.port, this.options.host, () => {
                console.log(`[agent] ${this.options.name} listening on ${this.options.host}:${this.options.port}`);
                resolve();
            });
        });
    }
    /** Stop the server */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server)
                return resolve();
            this.server.close((err) => (err ? reject(err) : resolve()));
        });
    }
    async handleRequest(req, res) {
        // Serve Agent Card at well-known URL
        if (req.method === "GET" && req.url?.includes(".well-known/agent.json")) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(this.getAgentCard()));
            return;
        }
        // Only accept POST for A2A JSON-RPC
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
        }
        // Parse body
        let body;
        try {
            const chunks = [];
            for await (const chunk of req)
                chunks.push(chunk);
            body = JSON.parse(Buffer.concat(chunks).toString());
        }
        catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32700, message: "Parse error" },
                id: null,
            }));
            return;
        }
        // Validate JSON-RPC
        if (body.jsonrpc !== "2.0" || !body.method) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32600, message: "Invalid JSON-RPC request" },
                id: body?.id || null,
            }));
            return;
        }
        // Handle message/send
        if (body.method === "message/send") {
            try {
                const message = body.params?.message;
                if (!message) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        error: { code: -32602, message: "Missing params.message" },
                        id: body.id,
                    }));
                    return;
                }
                const context = {
                    sender: body._directory?.sender || null,
                    senderVerified: body._directory?.senderVerified || false,
                    signatureValid: body._directory?.signatureValid ?? null,
                    verificationLevel: body._directory?.verificationLevel || "anonymous",
                    method: body.method,
                    raw: body,
                };
                const response = await this.options.onMessage(message, context);
                const task = this.responseToTask(body.id, response);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: task }));
            }
            catch (err) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    jsonrpc: "2.0",
                    id: body.id,
                    result: {
                        id: `task-${body.id}`,
                        status: { state: "failed", message: { role: "agent", parts: [{ kind: "text", text: err.message }] } },
                    },
                }));
            }
            return;
        }
        // Unsupported method
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32601, message: `Method not supported: ${body.method}` },
            id: body.id,
        }));
    }
    responseToTask(id, response) {
        let parts;
        if (typeof response === "string") {
            parts = [{ kind: "text", text: response }];
        }
        else if ("text" in response) {
            parts = [{ kind: "text", text: response.text }];
        }
        else if ("data" in response) {
            parts = [{ kind: "data", data: response.data }];
        }
        else if ("parts" in response) {
            parts = response.parts;
        }
        else if ("artifacts" in response) {
            return {
                id: `task-${id}`,
                status: { state: "completed" },
                artifacts: response.artifacts,
            };
        }
        else {
            parts = [{ kind: "text", text: String(response) }];
        }
        return {
            id: `task-${id}`,
            status: { state: "completed" },
            artifacts: [{ parts }],
        };
    }
    getAgentCard() {
        return {
            name: this.options.name,
            description: this.options.description,
            url: `http://${this.options.host}:${this.options.port}`,
            version: "1.0.0",
            capabilities: { streaming: false, pushNotifications: false },
            defaultInputModes: ["text/plain"],
            defaultOutputModes: ["text/plain"],
            skills: this.options.skills || [],
        };
    }
}
//# sourceMappingURL=server.js.map