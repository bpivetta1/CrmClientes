// Self-check: rode com `npx ts-node src/libs/evolution/normalizeNumber.check.ts`
import assert from "assert";
import { normalizeNumber } from "./EvolutionClient";

assert.strictEqual(normalizeNumber("5511999999999@s.whatsapp.net"), "5511999999999");
assert.strictEqual(normalizeNumber("+55 (11) 99999-9999"), "5511999999999");
assert.strictEqual(normalizeNumber("5511999999999"), "5511999999999");
// grupos preservam o JID completo
assert.strictEqual(normalizeNumber("12038201230-1620389@g.us"), "12038201230-1620389@g.us");

console.log("normalizeNumber checks passed");
