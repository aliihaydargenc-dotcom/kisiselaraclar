import test from "node:test";
import assert from "node:assert/strict";
import { getJson, putJson } from "../src/p16-office-ui-shared.js";

function withStorage(storage, run) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  try { return run(); }
  finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
}

test("P16 JSON yazımı başarı durumunu bildirir", () => {
  const map = new Map();
  withStorage({
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value)
  }, () => {
    assert.equal(putJson("kisiselaraclar:test", { a: 1 }), true);
    assert.deepEqual(getJson("kisiselaraclar:test", {}), { a: 1 });
  });
});

test("P16 JSON yazımı depolama hatasını sessiz başarı gibi göstermez", () => {
  withStorage({
    getItem: () => null,
    setItem: () => { throw new Error("quota"); }
  }, () => {
    assert.equal(putJson("kisiselaraclar:test", { a: 1 }), false);
  });
});
