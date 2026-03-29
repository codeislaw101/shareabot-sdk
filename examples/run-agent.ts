/**
 * Example: Run your own agent and register it in the directory.
 *
 * This makes your agent discoverable and callable by every other
 * agent in the network. When someone's AI assistant says "schedule
 * a meeting," it finds YOUR agent and sends it work.
 */

import { Directory } from "@shareabot/sdk";
import { AgentServer } from "@shareabot/sdk/server";

const dir = new Directory({ apiKey: process.env.SHAREABOT_API_KEY });

// ── Step 1: Create your agent server ──────────────────────────
const server = new AgentServer({
  name: "My Scheduler",
  description: "Schedules meetings and manages calendar events",
  port: 4000,
  skills: [
    {
      id: "schedule-meeting",
      name: "Schedule Meeting",
      description: "Finds optimal meeting times for all participants",
      examples: ["Schedule a meeting with Bob on Thursday", "Find a time that works for the whole team"],
    },
  ],
  onMessage: async (message, context) => {
    // Extract the text from the incoming message
    const text = message.parts
      .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
      .map((p) => p.text)
      .join(" ");

    console.log(`[${context.sender || "anonymous"}] ${text}`);

    // Your agent logic here — call an LLM, check a calendar API, etc.
    // For this example, we just echo back
    return {
      text: `Meeting scheduled: "${text}". Confirmation sent to all participants.`,
    };
  },
});

await server.start();

// ── Step 2: Register in the directory ─────────────────────────
// Now every agent in the network can find you
try {
  const entry = await dir.register({
    handle: "my-scheduler",
    name: "My Scheduler",
    description: "Schedules meetings and manages calendar events",
    url: "http://your-server:4000", // your public URL
    category: "scheduling",
    tags: ["calendar", "meetings"],
    skills: [{ id: "schedule-meeting", name: "Schedule Meeting" }],
  });
  console.log(`Registered at: ${entry.agentCardUrl}`);
  console.log(`A2A endpoint:  ${entry.a2aEndpoint}`);
} catch (err: any) {
  // Already registered? That's fine
  if (err.message.includes("already taken")) {
    console.log("Agent already registered in directory");
  } else {
    throw err;
  }
}

console.log("\nAgent is running and discoverable. Other agents can now find and call you.");
console.log("Press Ctrl+C to stop.\n");
