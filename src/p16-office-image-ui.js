import { PDFDocument } from "pdf-lib";
import { bitmap, canvasBlob, downloadBlob } from "./p15-ui-shared.js";
import { status, statusLine } from "./p16-office-ui-shared.js";

function annotateBody() {
  return `
    <label class="file-drop p16-file" for="p16AnnotateFile"><strong>Ekran görüntüsü / görsel seç</strong><span>PNG, JPEG veya WebP · cihazında işlenir</span><input id="p16AnnotateFile" type="file" accept="image/png,image/jpeg,image/webp" /></label>
    <div class="p16-toolbar">
      <button class="active" data-anno-tool="redact">Karart</button>
      <button data-anno-tool="pixelate">Pikselle</button>
      <button data-anno-tool="box">Kutu</button>
      <button data-anno-tool="arrow">Ok</button>
      <button id="p16AnnoUndo">Geri al</button>
      <button id="p16AnnoReset">Sıfırla</button>
    </div>
    <div class="p16-canvas-stage"><canvas id="p16AnnoCanvas"></canvas></div>
    <div class="action-row"><button class="primary-button" id="p16AnnoDownload" disabled>PNG indir</button></div>
    ${statusLine("Görsel seç; gizlemek veya işaretlemek istediğin alan üzerinde sürükle.")}`;
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width * canvas.width,
    y: (event.clientY - rect.top) / rect.height * canvas.height
  };
}
function drawArrow(ctx, a, b) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const head = Math.max(14, ctx.lineWidth * 4);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 6), b.y - head * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 6), b.y - head * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}
function pixelateRegion(canvas, x, y, w, h) {
  const ctx = canvas.getContext("2d");
  const sx = Math.max(0, Math.min(x, x + w));
  const sy = Math.max(0, Math.min(y, y + h));
  const sw = Math.min(canvas.width - sx, Math.abs(w));
  const sh = Math.min(canvas.height - sy, Math.abs(h));
  if (sw < 2 || sh < 2) return;
  const temp = document.createElement("canvas");
  const block = 12;
  temp.width = Math.max(1, Math.floor(sw / block));
  temp.height = Math.max(1, Math.floor(sh / block));
  const t = temp.getContext("2d");
  t.imageSmoothingEnabled = false;
  t.drawImage(canvas, sx, sy, sw, sh, 0, 0, temp.width, temp.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, 0, 0, temp.width, temp.height, sx, sy, sw, sh);
  ctx.restore();
}
function wireAnnotate(root) {
  const input = root.querySelector("#p16AnnotateFile");
  const canvas = root.querySelector("#p16AnnoCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let base = null;
  let tool = "redact";
  let startPoint = null;
  const history = [];
  const snapshot = () => history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  const restoreBase = () => {
    if (!base) return;
    canvas.width = base.width;
    canvas.height = base.height;
    ctx.drawImage(base, 0, 0);
    history.length = 0;
    snapshot();
  };
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    base?.close?.();
    base = await bitmap(file);
    const w = base.width || base.naturalWidth;
    const h = base.height || base.naturalHeight;
    const scale = Math.min(1, 1600 / Math.max(w, h));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    history.length = 0;
    snapshot();
    root.querySelector("#p16AnnoDownload").disabled = false;
    status(root, `${w}×${h} görsel hazır.`);
  };
  root.querySelector(".p16-toolbar").onclick = (event) => {
    const button = event.target.closest("[data-anno-tool]");
    if (button) {
      tool = button.dataset.annoTool;
      root.querySelectorAll("[data-anno-tool]").forEach((node) => node.classList.toggle("active", node === button));
    }
  };
  canvas.onpointerdown = (event) => { if (base) startPoint = canvasPoint(canvas, event); };
  canvas.onpointerup = (event) => {
    if (!base || !startPoint) return;
    const end = canvasPoint(canvas, event);
    const x = startPoint.x, y = startPoint.y, w = end.x - x, h = end.y - y;
    snapshot();
    if (tool === "redact") {
      ctx.fillStyle = "#0b0b0d"; ctx.fillRect(x, y, w, h);
    } else if (tool === "pixelate") {
      pixelateRegion(canvas, x, y, w, h);
    } else {
      ctx.strokeStyle = "#ff4d45"; ctx.lineWidth = Math.max(4, canvas.width / 280); ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (tool === "box") ctx.strokeRect(x, y, w, h);
      else drawArrow(ctx, startPoint, end);
    }
    startPoint = null;
  };
  root.querySelector("#p16AnnoUndo").onclick = () => {
    if (history.length <= 1) return;
    history.pop();
    ctx.putImageData(history[history.length - 1], 0, 0);
  };
  root.querySelector("#p16AnnoReset").onclick = restoreBase;
  root.querySelector("#p16AnnoDownload").onclick = async () => {
    downloadBlob(await canvasBlob(canvas, "image/png"), "isaretlenmis-gorsel.png");
    status(root, "PNG indirildi.");
  };
}

function scanBody() {
  return `
    <label class="file-drop p16-file" for="p16ScanFile"><strong>Belge fotoğrafı çek veya seç</strong><span>Mobilde kamera açılabilir · fotoğraf cihazında kalır</span><input id="p16ScanFile" type="file" accept="image/*" capture="environment"></label>
    <div class="p16-scan-controls">
      <label>Sol kırp %<input id="p16CropL" type="range" min="0" max="45" value="0"></label>
      <label>Sağ kırp %<input id="p16CropR" type="range" min="0" max="45" value="0"></label>
      <label>Üst kırp %<input id="p16CropT" type="range" min="0" max="45" value="0"></label>
      <label>Alt kırp %<input id="p16CropB" type="range" min="0" max="45" value="0"></label>
      <label>Kontrast<input id="p16ScanContrast" type="range" min="80" max="180" value="120"></label>
      <label class="p16-check"><input id="p16ScanGray" type="checkbox" checked> Siyah-beyaz</label>
    </div>
    <div class="action-row">
      <button class="secondary-button" id="p16ScanLeft">↺ 90°</button>
      <button class="secondary-button" id="p16ScanRight">90° ↻</button>
      <button class="primary-button" id="p16ScanPng" disabled>PNG indir</button>
      <button class="secondary-button" id="p16ScanPdf" disabled>PDF indir</button>
    </div>
    <div class="p16-canvas-stage p16-paper"><canvas id="p16ScanCanvas"></canvas></div>
    ${statusLine("Belge fotoğrafını seç; kırpma, döndürme ve temizleme ayarlarını yap.")}`;
}
function wireScan(root) {
  const input = root.querySelector("#p16ScanFile");
  const canvas = root.querySelector("#p16ScanCanvas");
  let source = null;
  let rotation = 0;
  const ids = ["p16CropL", "p16CropR", "p16CropT", "p16CropB", "p16ScanContrast", "p16ScanGray"];
  const controls = ids.map((id) => root.querySelector(`#${id}`));
  const draw = () => {
    if (!source) return;
    const sw0 = source.width || source.naturalWidth;
    const sh0 = source.height || source.naturalHeight;
    const l = Number(root.querySelector("#p16CropL").value) / 100;
    const r = Number(root.querySelector("#p16CropR").value) / 100;
    const t = Number(root.querySelector("#p16CropT").value) / 100;
    const b = Number(root.querySelector("#p16CropB").value) / 100;
    const sx = sw0 * l, sy = sh0 * t, sw = sw0 * Math.max(.1, 1 - l - r), sh = sh0 * Math.max(.1, 1 - t - b);
    const rotateSwap = Math.abs(rotation % 180) === 90;
    const max = 1800;
    const rawW = rotateSwap ? sh : sw;
    const rawH = rotateSwap ? sw : sh;
    const scale = Math.min(1, max / Math.max(rawW, rawH));
    canvas.width = Math.max(1, Math.round(rawW * scale));
    canvas.height = Math.max(1, Math.round(rawH * scale));
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.filter = `${root.querySelector("#p16ScanGray").checked ? "grayscale(1) " : ""}contrast(${root.querySelector("#p16ScanContrast").value}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    const dw = sw * scale, dh = sh * scale;
    ctx.drawImage(source, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };
  input.onchange = async () => {
    source?.close?.();
    source = await bitmap(input.files?.[0]);
    rotation = 0;
    controls.forEach((node) => {
      if (node.type === "range" && node.id !== "p16ScanContrast") node.value = 0;
    });
    draw();
    root.querySelector("#p16ScanPng").disabled = false;
    root.querySelector("#p16ScanPdf").disabled = false;
    status(root, "Belge hazır. Kenarları kırp ve görünümü temizle.");
  };
  controls.forEach((node) => node.addEventListener("input", draw));
  root.querySelector("#p16ScanLeft").onclick = () => { rotation = (rotation - 90) % 360; draw(); };
  root.querySelector("#p16ScanRight").onclick = () => { rotation = (rotation + 90) % 360; draw(); };
  root.querySelector("#p16ScanPng").onclick = async () => {
    downloadBlob(await canvasBlob(canvas, "image/png"), "taranmis-belge.png");
    status(root, "Temizlenmiş PNG indirildi.");
  };
  root.querySelector("#p16ScanPdf").onclick = async () => {
    const png = new Uint8Array(await (await canvasBlob(canvas, "image/png")).arrayBuffer());
    const doc = await PDFDocument.create();
    const image = await doc.embedPng(png);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    downloadBlob(new Blob([await doc.save()], { type: "application/pdf" }), "taranmis-belge.pdf");
    status(root, "PDF indirildi.");
  };
}


const VIEWS = {
  "image-annotate": { body: annotateBody, wire: wireAnnotate },
  "document-scan": { body: scanBody, wire: wireScan }
};
export const getImageOfficeView = (mode) => VIEWS[mode];
