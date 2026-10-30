/**
 * Security Input Sanitizer & Defensive Encoding Utility
 * Defends against Stored XSS, Reflected XSS, SSRF, and Null Byte Injections.
 * Compliant with OWASP ASVS V5 (Validation, Sanitization and Encoding).
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escapes HTML control characters in user inputs before persisting or rendering.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Removes dangerous HTML tags, inline event handlers, script blocks, and null bytes.
 */
export function sanitizeText(input: string, maxLength: number = 2000): string {
  if (!input || typeof input !== "string") return "";

  let cleaned = input
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove <script> tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove <iframe>, <object>, <embed>, <applet>
    .replace(/<(iframe|object|embed|applet|style|meta|link)[^>]*?>.*?<\/\1>/gi, "")
    // Remove inline javascript event attributes (onerror=, onload=, onclick=, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, "")
    // Remove javascript: and data: pseudo-protocols
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Validates that an image or media URL is safe, restricting to allowed protocols
 * and blocking SSRF targets (loopback, private subnets, cloud metadata).
 */
export function isSafeMediaUrl(url: string, allowedHosts: string[] = []): boolean {
  if (!url || typeof url !== "string") return false;

  // Allow relative paths starting with /uploads/
  if (url.startsWith("/uploads/")) {
    // Check for directory traversal
    if (url.includes("..") || url.includes("\\")) return false;
    return true;
  }

  try {
    const parsed = new URL(url);

    // Only HTTPS or HTTP allowed
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // SSRF Blocklist: Disallow loopback, link-local, private subnets, and cloud metadata
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "169.254.169.254", // AWS/GCP metadata
      "metadata.google.internal",
      "100.100.100.200", // Alibaba metadata
    ];

    if (blockedHosts.includes(hostname)) {
      return false;
    }

    // Disallow RFC 1918 Private IP spaces
    if (
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^127\./.test(hostname)
    ) {
      return false;
    }

    // If allowed hosts specified, verify hostname matches
    if (allowedHosts.length > 0) {
      const isAllowed = allowedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`)
      );
      if (!isAllowed) return false;
    }

    return true;
  } catch {
    return false;
  }
}
