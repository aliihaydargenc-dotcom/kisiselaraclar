import test from "node:test";
import assert from "node:assert/strict";
import {
  aspectRatio,
  decodeHtmlEntities,
  decodeJwt,
  escapeHtml,
  imageColorStats,
  jsonDiff,
  markdownToHtml,
  minifyCss,
  minifyHtml,
  pixelColor,
  regexMatches,
  sanitizeSvgText,
  sha256Text,
  svgInfo,
  transparencyReport,
  uuidV4FromBytes
} from "../src/p15-tools.js";

test("oran hesaplayıcı ölçüyü sadeleştirir", () => {
  assert.equal(aspectRatio(1920, 1080).ratio, "16:9");
  assert.equal(aspectRatio(1080, 1080).orientation, "square");
});
test("piksel renk seçici HEX üretir", () => {
  assert.equal(pixelColor(Uint8ClampedArray.from([255,0,0,255]),1,1,0,0).hex, "#FF0000");
});
test("görsel paleti baskın renkleri sıralar", () => {
  const data=Uint8ClampedArray.from([255,0,0,255,250,0,0,255,0,0,255,255]);
  const report=imageColorStats(data,{quantizeStep:16});
  assert.equal(report.colors[0].count,2);
  assert.equal(report.colors.length,2);
});
test("şeffaflık analizi alpha pikselini ayırır", () => {
  const report=transparencyReport(Uint8ClampedArray.from([0,0,0,0,0,0,0,128,0,0,0,255]));
  assert.deepEqual([report.transparent,report.translucent,report.opaque],[1,1,1]);
  assert.equal(report.hasAlpha,true);
});
test("SVG temizleyici script ve event handler kaldırır", () => {
  const clean=sanitizeSvgText('<svg viewBox="0 0 24 12" onload="alert(1)"><script>alert(1)</script><path /></svg>');
  assert.doesNotMatch(clean,/script|onload/i);
  const info=svgInfo(clean);
  assert.equal(info.width,24);
  assert.equal(info.height,12);
});
test("JSON diff path bazında farkları ayırır", () => {
  const report=jsonDiff('{"a":1,"b":2}','{"a":2,"c":3}');
  assert.deepEqual(report.summary,{added:1,removed:1,changed:1});
  assert.ok(report.changes.some(item=>item.path==="$.a"));
});
test("regex playground eşleşme ve capture döndürür", () => {
  const report=regexMatches("(a)","gi","Aba");
  assert.equal(report.matches.length,2);
  assert.equal(report.matches[0].groups[0].toLowerCase(),"a");
});
test("UUID byte girdisini v4 ve RFC variant bitleriyle üretir", () => {
  assert.equal(uuidV4FromBytes(new Uint8Array(16)),"00000000-0000-4000-8000-000000000000");
});
test("JWT okuyucu payload çözer fakat doğrulanmış saymaz", () => {
  const enc=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
  const result=decodeJwt(`${enc({alg:"none"})}.${enc({sub:"42"})}.sig`);
  assert.equal(result.payload.sub,"42");
  assert.equal(result.verified,false);
});
test("Markdown motoru ham HTML'i escape eder", () => {
  const html=markdownToHtml("# Başlık\n\n**kalın** <script>x</script>");
  assert.match(html,/<h1>Başlık<\/h1>/);
  assert.match(html,/<strong>kalın<\/strong>/);
  assert.match(html,/&lt;script&gt;/);
});
test("HTML ve CSS küçültücüler yorum ve gereksiz boşlukları kaldırır", () => {
  assert.equal(minifyHtml('<div>  a </div>\n<!--x--><span>b</span>'),'<div> a </div><span>b</span>');
  assert.equal(minifyCss('/*x*/ .a { color: red; }'),'.a{color:red}');
});
test("HTML entity encode decode roundtrip çalışır", () => {
  const source='<button title="a&b">Başla</button>';
  assert.equal(decodeHtmlEntities(escapeHtml(source)),source);
});
test("SHA-256 motoru geriye dönük sabit çıktıyı korur", async () => {
  assert.equal(await sha256Text("abc"),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
