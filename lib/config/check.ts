/* ==========================================================================
   Config validation CLI (audit #22). Prints the readiness report and exits
   non-zero when there is a blocking error — run it in the deploy/CI step with
   the production environment to catch a missing secret before it ships:
       NODE_ENV=production <prod env> npm run check:config
   In dev/preview the same gaps are informational and it exits 0.
   ========================================================================== */

import { validateConfig } from "./validate";

const r = validateConfig();
console.log(`environment: ${r.environment} (production=${r.production})`);
if (r.issues.length === 0) {
  console.log("  ok  no configuration issues");
} else {
  for (const i of r.issues) console.log(`  ${i.level === "error" ? "ERR " : "warn"} ${i.key}: ${i.message}`);
}
const errors = r.issues.filter((i) => i.level === "error").length;
console.log(errors ? `\n${errors} blocking config error(s).` : "\nConfig OK.");
process.exit(errors ? 1 : 0);
