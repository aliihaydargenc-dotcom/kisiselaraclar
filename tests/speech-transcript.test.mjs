import test from "node:test";
import assert from "node:assert/strict";
import {
  SpeechTranscriptBuffer,
  mergeSpeechTranscript,
  polishTranscript
} from "../src/speech-transcript.js";

function result(text, isFinal = false) {
  return Object.assign([{ transcript: text }], { isFinal });
}

test("P34 transcript buffer aynı result indexini append etmek yerine günceller", () => {
  const buffer = new SpeechTranscriptBuffer();
  assert.equal(buffer.updateFromEvent({ resultIndex: 0, results: [result("merhaba", false)] }), "Merhaba");
  assert.equal(buffer.updateFromEvent({ resultIndex: 0, results: [result("merhaba dünya", false)] }), "Merhaba dünya");
  assert.equal(buffer.updateFromEvent({ resultIndex: 0, results: [result("merhaba dünya", true)] }), "Merhaba dünya");
  assert.equal(buffer.finalText, "Merhaba dünya");
});

test("P34 transcript buffer final ve interim segmentleri index sırasıyla birleştirir", () => {
  const buffer = new SpeechTranscriptBuffer();
  buffer.updateFromEvent({ resultIndex: 0, results: [result("bugün raporu", true), result("göndere", false)] });
  assert.equal(buffer.text, "Bugün raporu göndere");
  buffer.updateFromEvent({ resultIndex: 1, results: [result("bugün raporu", true), result("göndereceğim", true)] });
  assert.equal(buffer.text, "Bugün raporu göndereceğim");
  assert.equal(buffer.finalText, "Bugün raporu göndereceğim");
});

test("P34 restart birleşimi tekrar eden kuyruk kelimelerini tekilleştirir", () => {
  assert.equal(mergeSpeechTranscript("Bugün raporu göndereceğim", "raporu göndereceğim ve çıkacağım"), "Bugün raporu göndereceğim ve çıkacağım");
  assert.equal(polishTranscript("merhaba merhaba dünya"), "Merhaba dünya");
});


test("P34.2 yeni recognition segmenti cümle ortasında gereksiz büyük harf üretmez", () => {
  assert.equal(
    mergeSpeechTranscript("Yarın raporu kontrol et ve düzelt", "sonra mail at"),
    "Yarın raporu kontrol et ve düzelt sonra mail at"
  );
  assert.equal(
    mergeSpeechTranscript("İlk cümle.", "sonra yeni cümle"),
    "İlk cümle. Sonra yeni cümle"
  );
});
