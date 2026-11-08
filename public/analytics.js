/* Google Tag Manager: dopo window.load + 2 secondi, quando il browser è libero. */
(() => {
  'use strict';
  const container = 'GTM-PWJKM7R2';
  let started = false, timer = null, idle = null, readyAt = Infinity;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function cancelSchedule() {
    if (timer !== null) clearTimeout(timer);
    if (idle !== null && window.cancelIdleCallback) window.cancelIdleCallback(idle);
    timer = idle = null;
  }
  function loadContainer() {
    timer = idle = null;
    if (started || document.visibilityState === 'hidden') return;
    started = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + container;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onerror = () => { /* Um bloqueio não afeta menu, conteúdo ou formulários. */ };
    document.head.appendChild(script);
  }
  function schedule() {
    cancelSchedule();
    if (started || !Number.isFinite(readyAt) || document.visibilityState === 'hidden') return;
    timer = setTimeout(() => {
      timer = null;
      if (started) return;
      if (window.requestIdleCallback) idle = window.requestIdleCallback(loadContainer, { timeout: 2000 });
      else timer = setTimeout(loadContainer, 0);
    }, Math.max(0, readyAt - Date.now()));
  }
  function pageLoaded() { readyAt = Date.now() + 2000; schedule(); }
  if (document.readyState === 'complete') pageLoaded();
  else window.addEventListener('load', pageLoaded, { once: true });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pagehide', cancelSchedule);
  window.addEventListener('pageshow', schedule);
})();
