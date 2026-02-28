const express = require("express");
const https = require("https");
const app = express();

function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).send("No URL");

  // Request the video from Twitter, acting like a browser
  https.get(url, (twitterRes) => {
    // Copy headers (content-type, length) so the browser knows it's a video
    res.writeHead(twitterRes.statusCode, twitterRes.headers);

    // Pipe the data straight through
    twitterRes.pipe(res);
  });
}

app.get("/proxy", handler);
app.listen(4500, () => {
  console.log("Server listening");
});
