const express = require("express");
const https = require("https");
const http = require("http");
const app = express();

// Hop-by-hop headers must not be forwarded to the client
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
]);

const MAX_REDIRECTS = 5;

function fetchWithRedirects(url, requestHeaders, redirectCount, res) {
  if (redirectCount > MAX_REDIRECTS) {
    return res.status(502).send("Too many redirects");
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send("Invalid URL");
  }

  const transport = parsed.protocol === "https:" ? https : http;

  const req = transport.get(
    {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: requestHeaders,
    },
    (upstream) => {
      const status = upstream.statusCode;

      // Follow redirects
      if (
        [301, 302, 307, 308].includes(status) &&
        upstream.headers.location
      ) {
        upstream.resume(); // drain so socket is freed
        const next = upstream.headers.location.startsWith("http")
          ? upstream.headers.location
          : new URL(upstream.headers.location, url).href;
        fetchWithRedirects(next, requestHeaders, redirectCount + 1, res);
        return;
      }

      // Build forwarded headers — strip hop-by-hop
      const responseHeaders = { "access-control-allow-origin": "*" };
      for (const [key, value] of Object.entries(upstream.headers)) {
        if (!HOP_BY_HOP.has(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      }
      // Always advertise range support
      responseHeaders["accept-ranges"] = "bytes";

      res.writeHead(status, responseHeaders);
      upstream.pipe(res);
    },
  );

  req.on("error", (err) => {
    console.error("Upstream error:", err.message);
    if (!res.headersSent) res.status(502).send("Upstream error");
  });
}

// Handle CORS preflight for Range header
app.options("/proxy", (_req, res) => {
  res
    .set("Access-Control-Allow-Origin", "*")
    .set("Access-Control-Allow-Headers", "Range")
    .set("Access-Control-Max-Age", "86400")
    .sendStatus(204);
});

app.get("/proxy", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("No URL");

  const requestHeaders = {};
  if (req.headers.range) {
    requestHeaders["Range"] = req.headers.range;
  }

  fetchWithRedirects(url, requestHeaders, 0, res);
});

app.listen(4500, () => console.log("Proxy listening on :4500"));
