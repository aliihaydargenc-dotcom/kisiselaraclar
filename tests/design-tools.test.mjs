import test from "node:test";
import assert from "node:assert/strict";
import {
  buttonCss,
  contrastRatio,
  generateHarmony,
  generateSiteTheme,
  normalizeHex
} from "../src/design-tools.js";

test("normalizeHex uppercases valid colors", () => {
  assert.equal(normalizeHex("#4967ff"), "#4967FF");
});

test("WCAG contrast reference values are sane", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.ok(contrastRatio("#111318", "#FFFFFF") > 16);
});

test("harmony returns distinct usable colors", () => {
  const colors = generateHarmony("#4967FF", "analogous");
  assert.equal(colors.length, 5);
  assert.equal(new Set(colors).size, 5);
});

test("site theme keeps body and primary text readable", () => {
  for (const scheme of ["light", "dark"]) {
    const theme = generateSiteTheme("#4967FF", scheme);
    assert.ok(theme.checks.body >= 4.5);
    assert.ok(theme.checks.primary >= 4.5);
  }
});

test("mobile button defaults to recommended touch height", () => {
  const result = buttonCss({ mode: "mobile", color: "#4967FF" });
  assert.equal(result.metrics.recommendedTouch, true);
  assert.match(result.css, /min-height: 48px/);
});
