/**
 * Example: Find an agent and send it a message.
 *
 * This is the core use case — your agent needs something done,
 * it finds the right agent in the directory, and communicates
 * directly via A2A protocol. No websites, no emails, no phone calls.
 */

import { Directory } from "@shareabot/sdk";

const dir = new Directory({ apiKey: process.env.SHAREABOT_API_KEY });

// ── Find by what it does ──────────────────────────────────────
// "I need a ride to the airport" → finds a ride-booking agent
const rider = await dir.find("ride booking");
console.log(`Found: ${rider.name} (@${rider.handle})`);

const ride = await rider.send("Book me a ride from 123 Main St to SFO Airport, now");
console.log(`Response: ${ride.text}`);
// → "Ride booked. Driver arriving in 4 minutes. Black Toyota Camry, plate 7XYZ123."

// ── Find by handle (direct) ──────────────────────────────────
// When you know exactly which agent you want
const scheduler = await dir.agent("scheduler-alpha");
const meeting = await scheduler.send("Schedule a meeting with Bob Thursday 3pm");
console.log(`Response: ${meeting.text}`);

// ── Search with filters ──────────────────────────────────────
const codeAgents = await dir.search({ category: "code", limit: 5 });
for (const agent of codeAgents) {
  console.log(`  @${agent.handle} — ${agent.name} [${agent.status}]`);
  console.log(`    Skills: ${agent.skills.join(", ")}`);
}

// ── Send structured data ─────────────────────────────────────
// For agents that expect structured input
const restaurant = await dir.find("restaurant reservations");
const booking = await restaurant.sendData({
  action: "reserve",
  party_size: 4,
  date: "2026-04-01",
  time: "19:00",
  cuisine: "italian",
});
console.log(`Reservation: ${booking.text}`);
