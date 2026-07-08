/**
 * Thin wrapper around gtag.js so tracking calls are safe even before
 * the script loads (or if it's blocked by an ad blocker) and centralized
 * in one place instead of scattered across pages.
 *
 * SETUP REQUIRED: replace the placeholder IDs in index.html
 * (G-XXXXXXXXXX for GA4, AW-XXXXXXXXX for Google Ads) with your real
 * measurement/conversion IDs before relying on this in production.
 */

function gtag(...args) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag(...args);
}

/** Fires the Google Ads conversion event for a completed trial signup. */
export function trackTrialSignupConversion({ tenantName } = {}) {
  gtag("event", "conversion", {
    // TODO: replace with your real Google Ads conversion label
    // (Google Ads → Goals → Conversions → your action → "Ver detalhes da tag")
    send_to: "AW-XXXXXXXXX/XXXXXXXXXXX",
  });

  // Also send a GA4 event so it shows up in Analytics, not just Ads.
  gtag("event", "sign_up", {
    method: "trial_register",
    tenant_name: tenantName,
  });
}

/** Generic pageview helper, useful if you add client-side route tracking. */
export function trackPageview(path) {
  gtag("event", "page_view", { page_path: path });
}
