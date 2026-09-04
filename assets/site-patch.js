(() => {
  const applyPatch = () => {
    const wordmark = document.querySelector("svg.wordmark");
    if (wordmark) {
      wordmark.setAttribute("viewBox", "0 18 386 74");
      const topRule = wordmark.querySelector(":scope > g > path:first-child");
      if (topRule?.getAttribute("d") === "M7 0h333v11H7z") topRule.remove();
    }

    const footerMeta = document.querySelector(".footer-meta");
    if (footerMeta && !footerMeta.querySelector('a[href="/privacy/"]')) {
      const privacyLink = document.createElement("a");
      privacyLink.href = "/privacy/";
      privacyLink.textContent = "Privacy";
      footerMeta.prepend(privacyLink);
    }

    return Boolean(wordmark && footerMeta);
  };

  if (!applyPatch()) {
    const observer = new MutationObserver(() => {
      if (applyPatch()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
