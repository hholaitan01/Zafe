/* ==========================================================================
   Self-check for the production money guard (audit P0 #1): a money-move must
   fail closed in production when no live provider / real store is configured,
   and stay permissive in dev/preview (where the demo seams are expected).
   Run: `npx tsx lib/payments/prod-guard.check.ts`.
   ========================================================================== */

export {}; // module scope

// No provider / no Supabase configured → activeProvider is mock, store is demo.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.PAYSTACK_SECRET_KEY;
delete process.env.FLW_SECRET_KEY;
delete process.env.PAYMENTS_PROVIDER;
const env = process.env as Record<string, string | undefined>;
const savedNodeEnv = env.NODE_ENV;

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { productionMoneyGuard } = await import("./config");

  // Dev/preview: demo seams are expected, so a money-move is allowed.
  env.NODE_ENV = "development";
  assert("dev/preview allows the demo money path", productionMoneyGuard() === null);
  env.NODE_ENV = "test";
  assert("test env allows the demo money path", productionMoneyGuard() === null);

  // Production with nothing configured: fail closed with a specific reason.
  env.NODE_ENV = "production";
  const block = productionMoneyGuard();
  assert("production with no provider + no store is blocked", block !== null);
  assert("the reason names the missing live payment provider", !!block && /payment provider/i.test(block));
  assert("the reason names the demo store fallback", !!block && /demo store/i.test(block));

  env.NODE_ENV = savedNodeEnv;
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
