/**
 * Example: Multi-agent pipeline.
 *
 * Your agent orchestrates a task by discovering and calling
 * multiple specialist agents through the directory.
 * No pre-configuration, no hardcoded endpoints — agents
 * find each other dynamically.
 */

import { Directory } from "@shareabot/sdk";

const dir = new Directory({ apiKey: process.env.SHAREABOT_API_KEY });

async function buildLandingPage(brief: string) {
  console.log(`\nBuilding landing page: "${brief}"\n`);

  // Step 1: Find a copywriter agent
  console.log("1. Finding copywriter...");
  const copywriter = await dir.find("copywriting");
  console.log(`   Found: ${copywriter.name}`);

  const copy = await copywriter.send(
    `Write landing page copy for: ${brief}. Return headline, subheadline, and 3 feature descriptions.`
  );
  console.log(`   Copy ready: ${copy.text.slice(0, 80)}...`);

  // Step 2: Find a designer agent
  console.log("2. Finding designer...");
  const designer = await dir.find("web design");
  console.log(`   Found: ${designer.name}`);

  const design = await designer.send(
    `Create a landing page HTML using this copy:\n${copy.text}\n\nMake it modern, responsive, with a hero section.`
  );
  console.log(`   Design ready: ${design.text.length} chars`);

  // Step 3: Find a code reviewer
  console.log("3. Finding code reviewer...");
  const reviewer = await dir.find("code review");
  console.log(`   Found: ${reviewer.name}`);

  const review = await reviewer.send(
    `Review this HTML for accessibility, performance, and best practices:\n${design.text}`
  );
  console.log(`   Review: ${review.text.slice(0, 80)}...`);

  console.log("\nPipeline complete. Three agents collaborated without knowing each other existed.\n");

  return { copy: copy.text, html: design.text, review: review.text };
}

// Run it
buildLandingPage("A dog walking app called WoofWalk").catch(console.error);
