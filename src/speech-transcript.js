function normalizeTranscriptBody(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/(\p{L}[\p{L}\p{N}'’-]*)(?:\s+\1){1,}/giu, "$1")
    .trim();
}

export function polishTranscript(value) {
  const text = normalizeTranscriptBody(value);
  if (!text) return "";
  return text.replace(
    /(^|[.!?]\s+)([a-zçğıöşü])/g,
    (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("tr-TR")}`
  );
}

function normalizeWord(word) {
  return String(word || "").toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü0-9]/gi, "");
}

export function mergeSpeechTranscript(baseValue, segmentValue) {
  const base = polishTranscript(baseValue);
  const segment = normalizeTranscriptBody(segmentValue);
  if (!segment) return base;
  if (!base) return polishTranscript(segment);

  const baseWords = base.split(" ");
  const segmentWords = segment.split(" ");
  const maxOverlap = Math.min(baseWords.length, segmentWords.length, 20);
  let overlap = 0;

  for (let count = maxOverlap; count > 0; count -= 1) {
    const tail = baseWords.slice(-count).map(normalizeWord).join(" ");
    const head = segmentWords.slice(0, count).map(normalizeWord).join(" ");
    if (tail && tail === head) {
      overlap = count;
      break;
    }
  }
  return polishTranscript(`${base} ${segmentWords.slice(overlap).join(" ")}`);
}

export class SpeechTranscriptBuffer {
  #results = new Map();

  reset() {
    this.#results.clear();
  }

  updateFromEvent(event) {
    const start = Math.max(0, Number(event?.resultIndex) || 0);
    const results = event?.results;
    const length = Number(results?.length) || 0;

    for (let index = start; index < length; index += 1) {
      const result = results[index];
      const text = String(result?.[0]?.transcript || "").trim();
      if (!text) {
        this.#results.delete(index);
        continue;
      }
      this.#results.set(index, { text, final: Boolean(result?.isFinal) });
    }

    for (const index of [...this.#results.keys()]) {
      if (index >= length) this.#results.delete(index);
    }
    return this.text;
  }

  get text() {
    return polishTranscript(
      [...this.#results.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, item]) => item.text)
        .join(" ")
    );
  }

  get finalText() {
    return polishTranscript(
      [...this.#results.entries()]
        .sort(([a], [b]) => a - b)
        .filter(([, item]) => item.final)
        .map(([, item]) => item.text)
        .join(" ")
    );
  }
}
