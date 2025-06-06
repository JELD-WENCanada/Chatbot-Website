let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 10 minutes (customizable)

export default async function handler(req, res) {
  try {
    const now = Date.now();

    // ✅ Serve from cache if it's still fresh
    if (cache && (now - cacheTimestamp < CACHE_DURATION)) {
      return res.status(200).json(cache);
    }

    // ❗ Fetch fresh data from Google Apps Script
    const response = await fetch("https://script.google.com/macros/s/AKfycbwYE0h0I3aK3xzCNXEv06M1z9WjpYTUXqnWNWPjsk9dwqRO3ooXC00KdzrtNf-jwzQbyw/exec");

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with ${response.status}`);
    }

    const data = await response.json();

    // ✅ Store in cache
    cache = data;
    cacheTimestamp = now;

    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch chatbot intents:", error);
    res.status(500).json({ error: "Failed to fetch chatbot intents" });
  }
}
