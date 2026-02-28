const functions = require("firebase-functions");
const https = require("https");

exports.proxyVideo = functions.https.onRequest((req, res) => {
  // 1. Enable CORS so your app (localhost:3000 or production) can use this
  res.set("Access-Control-Allow-Origin", "*");
  
  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  const videoUrl = req.query.url;

  if (!videoUrl) {
    res.status(400).send("Missing 'url' query parameter");
    return;
  }

  // 2. The Proxy Logic
  https.get(videoUrl, (twitterRes) => {
    // Forward the status code from Twitter (200, 404, etc.)
    res.status(twitterRes.statusCode);

    // Forward the content headers (video/mp4, content-length)
    // This allows the browser to show the scrub bar properly
    if (twitterRes.headers["content-type"]) {
      res.set("Content-Type", twitterRes.headers["content-type"]);
    }
    if (twitterRes.headers["content-length"]) {
      res.set("Content-Length", twitterRes.headers["content-length"]);
    }

    // Pipe the stream directly to the client
    twitterRes.pipe(res);
  }).on("error", (err) => {
    console.error("Proxy Error:", err);
    res.status(500).send("Failed to proxy video");
  });
});
