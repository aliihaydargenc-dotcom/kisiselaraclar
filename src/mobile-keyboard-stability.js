(() => {
  const mobileQuery = globalThis.matchMedia?.("(max-width: 760px)");
  const editableSelector = "textarea, input, [contenteditable='true']";
  let layoutWidth = globalThis.innerWidth || document.documentElement.clientWidth || 0;
  let keyboardOpen = false;

  const isMobile = () => mobileQuery?.matches ?? ((globalThis.innerWidth || 0) <= 760);
  const isEditable = (node) => node instanceof Element && node.matches(editableSelector);

  const setKeyboardState = (open) => {
    keyboardOpen = Boolean(open && isMobile());
    document.documentElement.classList.toggle("keyboard-open", keyboardOpen);
  };

  const updateFromFocus = () => {
    setKeyboardState(isEditable(document.activeElement));
  };

  // Android/iOS soft keyboards emit window resize events when only viewport height changes.
  // The workspace has a resize listener that rebuilds the notes view, which would replace
  // the focused textarea and dismiss the keyboard. Swallow height-only mobile resizes while
  // preserving real layout/breakpoint changes such as rotation or desktop window resizing.
  globalThis.addEventListener("resize", (event) => {
    const nextWidth = globalThis.innerWidth || document.documentElement.clientWidth || 0;
    const widthChanged = Math.abs(nextWidth - layoutWidth) > 2;

    if (isMobile() && !widthChanged) {
      if (isEditable(document.activeElement) || keyboardOpen) setKeyboardState(true);
      event.stopImmediatePropagation();
      return;
    }

    layoutWidth = nextWidth;
    updateFromFocus();
  }, true);

  document.addEventListener("focusin", (event) => {
    if (isEditable(event.target)) setKeyboardState(true);
  }, true);

  document.addEventListener("focusout", () => {
    globalThis.setTimeout(() => {
      setKeyboardState(isEditable(document.activeElement));
    }, 120);
  }, true);

  globalThis.visualViewport?.addEventListener("resize", () => {
    if (isEditable(document.activeElement)) setKeyboardState(true);
  });
})();
