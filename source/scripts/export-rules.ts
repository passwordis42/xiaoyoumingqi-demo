import { writeFileSync } from "fs";
import { EVENT_POOL } from "../src/content/e-events.ts";
import { C_ROUNDS } from "../src/content/c-rounds.ts";
import { TOPICS } from "../src/content/a-topics.ts";
import { RULE_CONFIG } from "../src/sim/rules.ts";

const payload = {
  ...RULE_CONFIG,
  catalog: {
    topics: TOPICS,
    readings: C_ROUNDS,
    events: EVENT_POOL,
  },
};

writeFileSync("public/rule-config.json", JSON.stringify(payload, null, 2) + "\n");
console.log("wrote public/rule-config.json");
