// pages/api/chatbot.js
export default async function handler(req, res) {
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbwYE0h0I3aK3xzCNXEv06M1z9WjpYTUXqnWNWPjsk9dwqRO3ooXC00KdzrtNf-jwzQbyw/exec");
    
    if (!response.ok) {
      throw new Error(`Google Apps Script responded with ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch chatbot intents:", error);
    res.status(500).json({ error: "Failed to fetch chatbot intents" });
  }
}

