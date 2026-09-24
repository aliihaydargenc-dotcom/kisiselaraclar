export const MEDIA_INFO_LIMIT = 750 * 1024 * 1024;
export const MEDIA_CONVERT_LIMIT = 100 * 1024 * 1024;

export const MEDIA_OUTPUTS = Object.freeze({
  mp4: { extension: "mp4", mimeType: "video/mp4", audioOnly: false },
  webm: { extension: "webm", mimeType: "video/webm", audioOnly: false },
  mp3: { extension: "mp3", mimeType: "audio/mpeg", audioOnly: true },
  wav: { extension: "wav", mimeType: "audio/wav", audioOnly: true }
});

const MEDIA_EXTENSIONS = new Set([
  "mp4", "m4v", "mov", "webm", "mkv", "mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"
]);

function extensionOf(name = "") {
  const clean = String(name || "").toLowerCase().split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1) : "";
}

export function validateMediaDescriptor(fileLike = {}, { conversion = false } = {}) {
  const name = String(fileLike.name || "");
  const size = Number(fileLike.size || 0);
  const type = String(fileLike.type || "").toLowerCase();
  if (!name) throw new Error("Bir ses veya video dosyası seç.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("Medya dosyası boş.");
  const limit = conversion ? MEDIA_CONVERT_LIMIT : MEDIA_INFO_LIMIT;
  if (size > limit) {
    const label = conversion ? "100 MB" : "750 MB";
    throw new Error(`Bu işlem için dosya ${label} sınırını aşıyor.`);
  }

  const ext = extensionOf(name);
  const mediaMime = type.startsWith("audio/") || type.startsWith("video/");
  if (!mediaMime && !MEDIA_EXTENSIONS.has(ext)) {
    throw new Error("Desteklenen bir ses/video dosyası seç.");
  }
  return { name, size, type, extension: ext };
}

export function normalizeTrimRange(start, end, duration = null) {
  const from = Number(start);
  const to = Number(end);
  if (!Number.isFinite(from) || from < 0) throw new Error("Başlangıç süresi 0 veya daha büyük olmalı.");
  if (!Number.isFinite(to) || to <= from) throw new Error("Bitiş süresi başlangıçtan büyük olmalı.");
  if (Number.isFinite(duration) && to > duration + 0.05) {
    throw new Error("Bitiş süresi dosyanın toplam süresini aşıyor.");
  }
  return { start: from, end: to };
}

export function formatMediaDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const secText = secs.toFixed(total < 60 ? 1 : 0).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secText}`
    : `${minutes}:${secText}`;
}

export function formatMediaBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

async function openInput(file) {
  const media = await import("mediabunny");
  const input = new media.Input({
    formats: media.ALL_FORMATS,
    source: new media.BlobSource(file)
  });
  if (!(await input.canRead())) throw new Error("Bu medya kapsayıcısı okunamadı.");
  return { media, input };
}

function cleanTag(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const parts = value.filter((item) => typeof item === "string" || typeof item === "number");
    return parts.length ? parts.join(", ") : "";
  }
  return "";
}

export async function inspectMediaFile(file) {
  validateMediaDescriptor(file);
  const { input } = await openInput(file);
  const [mimeType, format, tracks, tags] = await Promise.all([
    input.getMimeType(),
    input.getFormat(),
    input.getTracks(),
    input.getMetadataTags().catch(() => ({}))
  ]);

  let duration = await input.getDurationFromMetadata(undefined, { skipLiveWait: true });
  if (!Number.isFinite(duration)) {
    duration = await input.computeDuration(undefined, { skipLiveWait: true });
  }

  const trackRows = await Promise.all(tracks.map(async (track) => {
    const base = {
      type: track.type,
      number: track.number,
      codec: await track.getCodec(),
      bitrate: await track.getAverageBitrate(),
      language: await track.getLanguageCode()
    };
    if (track.type === "video") {
      return {
        ...base,
        width: await track.getDisplayWidth(),
        height: await track.getDisplayHeight(),
        rotation: await track.getRotation()
      };
    }
    if (track.type === "audio") {
      return {
        ...base,
        channels: await track.getNumberOfChannels(),
        sampleRate: await track.getSampleRate()
      };
    }
    return base;
  }));

  const metadata = {};
  for (const key of ["title", "artist", "album", "albumArtist", "genre", "date", "comment", "copyright"]) {
    const value = cleanTag(tags?.[key]);
    if (value) metadata[key] = value;
  }

  return {
    name: file.name,
    size: file.size,
    mimeType,
    format: format?.constructor?.name?.replace(/InputFormat$/, "") || "Bilinmiyor",
    duration: Number.isFinite(duration) ? duration : null,
    tracks: trackRows,
    metadata
  };
}

function makeOutputFormat(media, id) {
  if (id === "mp4") return new media.Mp4OutputFormat();
  if (id === "webm") return new media.WebMOutputFormat();
  if (id === "mp3") return new media.Mp3OutputFormat();
  if (id === "wav") return new media.WavOutputFormat();
  throw new Error("Hedef medya formatı desteklenmiyor.");
}

function discardedReasonLabel(reason) {
  const labels = {
    unknown_source_codec: "kaynak codec tanınmıyor",
    undecodable_source_codec: "kaynak codec tarayıcıda çözülemiyor",
    no_encodable_target_codec: "tarayıcı hedef codec'i encode edemiyor",
    max_track_count_reached: "hedef format track sınırına ulaştı",
    max_track_count_of_type_reached: "hedef format bu track türünü kabul etmiyor",
    cannot_copy: "track doğrudan kopyalanamıyor"
  };
  return labels[reason] || reason;
}

export async function convertMediaFile(file, {
  format = "mp4",
  start = null,
  end = null,
  width = null,
  onProgress = () => {}
} = {}) {
  validateMediaDescriptor(file, { conversion: true });
  const targetSpec = MEDIA_OUTPUTS[format];
  if (!targetSpec) throw new Error("Geçersiz hedef format.");

  const { media, input } = await openInput(file);
  const outputFormat = makeOutputFormat(media, format);
  const target = new media.BufferTarget();
  const output = new media.Output({ format: outputFormat, target });

  let trim;
  if (start !== null || end !== null) {
    let duration = await input.getDurationFromMetadata(undefined, { skipLiveWait: true });
    if (!Number.isFinite(duration)) {
      duration = await input.computeDuration(undefined, { skipLiveWait: true });
    }
    trim = normalizeTrimRange(start ?? 0, end ?? duration, duration);
  }

  const numericWidth = Number(width);
  const video = targetSpec.audioOnly
    ? { discard: true }
    : Number.isFinite(numericWidth) && numericWidth > 0
      ? { width: Math.round(numericWidth), fit: "contain" }
      : {};

  const conversion = await media.Conversion.init({
    input,
    output,
    tracks: "primary",
    video,
    trim,
    showWarnings: false
  });

  if (!conversion.isValid) {
    const reasons = [...new Set(
      conversion.discardedTracks
        .filter((item) => item.reason !== "discarded_by_user")
        .map((item) => discardedReasonLabel(item.reason))
    )];
    throw new Error(
      reasons.length
        ? `Bu dönüşüm bu tarayıcıda yapılamıyor: ${reasons.join(", ")}.`
        : "Bu dönüşüm bu tarayıcıda desteklenmiyor."
    );
  }

  conversion.onProgress = (value) => {
    const progress = Math.max(0, Math.min(1, Number(value) || 0));
    onProgress(progress);
  };
  await conversion.execute();

  if (!target.buffer) throw new Error("Medya çıktısı üretilemedi.");
  const extension = outputFormat.fileExtension.replace(/^\./, "");
  const mimeType = outputFormat.mimeType || targetSpec.mimeType;
  return {
    buffer: target.buffer,
    blob: new Blob([target.buffer], { type: mimeType }),
    extension,
    mimeType,
    size: target.buffer.byteLength
  };
}
