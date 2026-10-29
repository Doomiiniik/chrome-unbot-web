const test = require("node:test");
const assert = require("node:assert");
const { analyzeFingerprint, validateFingerprint } = require("../scoring");

test("clean browser gets score 0", () => {
  const result = analyzeFingerprint({ canvas: "ok", webrtc: "enabled" });
  assert.strictEqual(result.score, 0);
});


test("webdriver gets 50", () => {
  const result = analyzeFingerprint({ canvas: "ok", webrtc: "enabled",navigator_entropy: { webdriver: true } });
  assert.strictEqual(result.score, 50);
});


test("webdriver + faked user agent gets 100", () => {
  const result = analyzeFingerprint({ canvas: "ok", webrtc: "enabled",navigator_entropy: { webdriver: true },user_agent: "HeadlessChrome",}, null, "Chrome");
  assert.strictEqual(result.score, 100);
});

test("faked user agent gets 40", () => {
  const result = analyzeFingerprint({user_agent: "Chrome",}, null, "Firefox");
  assert.strictEqual(result.score, 40);
});


test("wrong data", () => {
  const result = validateFingerprint({hardware_concurrency: "banan" });
  const result2 = validateFingerprint({hardware_concurrency: 4 });
  assert.notStrictEqual(result, null);
  assert.strictEqual(result2,null);
});







