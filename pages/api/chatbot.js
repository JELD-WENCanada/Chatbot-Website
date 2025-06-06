export default async function handler(req, res) {
  const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxS-0kLirrcAybKpmKrXmnznVOGAwVWDHVWQIHYqso-/exec";

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL);

    if (!response.ok) {
      throw new Error(`Google Sheets API returned status ${response.status}`);
    }

    const data = await response.json();

    // Expecting data to have 'intents' key
    if (!data.intents) {
      throw new Error("No 'intents' property found in Google Sheets data");
    }

    res.status(200).json({ intents: data.intents });
  } catch (error) {
    console.error("Error fetching chatbot intents:", error);
    res.status(500).json({ error: "Failed to fetch chatbot intents" });
  }
}
