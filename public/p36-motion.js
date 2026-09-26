/* P36 — resilient motion layer
   Motion is enhancement-only: if CDN import fails or reduced-motion is enabled,
   the application remains fully functional. This file lives in public/ so it does
   not inflate the Vite core application bundle. */

const MOTION_URL = "https://cdn.jsdelivr.net/npm/motion@13.4.4/+esm";
const VISUAL_STYLESHEET = "/p36-visual-impact.css?v=36.1";
const UI_RENDER_EVENT = "kisiselaraclar:ui-rendered";
const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
const seen = new WeakSet();
let motionPromise = null;
let renderTimer = 0;

function ensureVisualLayer() {
  document.documentElement.dataset.visualSystem = "p36.1";
  if (document.querySelector('link[data-p36-visual="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = VISUAL_STYLESHEET;
  link.dataset.p36Visual = "true";
  document.head.append(link);
}

function shouldAnimate() {
  if (reducedMotion?.matches) return false;
  if (navigator.connection?.saveData) return false;
  return true;
}

function loadMotion() {
  if (!shouldAnimate()) return Promise.resolve(null);
  if (!motionPromise) {
    motionPromise = import(MOTION_URL).catch((error) => {
      console.warn("P36 motion enhancement unavailable:", error);
      return null;
    });
  }
  return motionPromise;
}

function visibleElements(selector, root = document) {
  return [...root.querySelectorAll(selector)].filter((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (seen.has(node)) return false;
    if (node.hidden || node.classList.contains("hidden")) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

async function reveal(selector, root, { y = 10, scale = .992, delayStep = .035, duration = .42 } = {}) {
  const motion = await loadMotion();
  if (!motion) return;
  const nodes = visibleElements(selector, root);
  if (!nodes.length) return;
  nodes.forEach((node) => seen.add(node));
  motion.animate(
    nodes,
    { opacity: [0, 1], y: [y, 0], scale: [scale, 1] },
    { duration, delay: motion.stagger(delayStep), ease: [.16, 1, .3, 1] }
  );
}

async function animateCurrentScene(root = document) {
  if (!shouldAnimate()) return;
  await reveal(".p25-head, .catalog-head, .tool-title-row", root, { y: 7, scale: .997, delayStep: .02, duration: .34 });
  await reveal(".p25-card, .quick-section, .smart-router.has-files, .tool-panel", root, { y: 14, delayStep: .055, duration: .46 });
  await reveal(".tool-card, .quick-tool, .smart-tool-card, .desktop-tool-item", root, { y: 9, delayStep: .026, duration: .38 });
}

function scheduleScene(root = document) {
  clearTimeout(renderTimer);
  renderTimer = globalThis.setTimeout(() => {
    requestAnimationFrame(() => animateCurrentScene(root));
  }, 24);
}

function wirePressFeedback() {
  const selector = ".primary-button, .secondary-button, .p25-link, .p17-action, .tool-card, .quick-tool, .desktop-tool-item, .mobile-dock button";
  document.addEventListener("pointerdown", (event) => {
    if (!shouldAnimate()) return;
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (!(target instanceof HTMLElement) || target.matches(":disabled")) return;
    loadMotion().then((motion) => motion?.animate(target, { scale: .982 }, { duration: .11, ease: [.2, .8, .2, 1] }));
  }, { passive: true });

  const release = (event) => {
    if (!shouldAnimate()) return;
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (!(target instanceof HTMLElement)) return;
    loadMotion().then((motion) => motion?.animate(target, { scale: 1 }, { duration: .24, ease: [.16, 1, .3, 1] }));
  };
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", release, { passive: true });
}

function wireDrawerState() {
  const observer = new MutationObserver((records) => {
    if (!shouldAnimate()) return;
    if (!records.some((record) => record.attributeName === "class")) return;
    const drawer = document.querySelector("#mobileToolsDrawer");
    if (!(drawer instanceof HTMLElement) || !document.body.classList.contains("mobile-tools-open")) return;
    loadMotion().then((motion) => motion?.animate(drawer, { opacity: [.92, 1] }, { duration: .22, ease: [.2, .8, .2, 1] }));
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

function initMotionSystem() {
  ensureVisualLayer();
  document.documentElement.dataset.motionSystem = shouldAnimate() ? "enhanced" : "reduced";
  wirePressFeedback();
  wireDrawerState();
  globalThis.addEventListener(UI_RENDER_EVENT, () => scheduleScene(document));
  scheduleScene(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMotionSystem, { once: true });
} else {
  initMotionSystem();
}
