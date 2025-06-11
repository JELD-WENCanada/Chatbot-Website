export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbx57TdjldhTs5vVghE7uQEpr-chXyMX5VOov4RCnMa_etkJXiR6nHJr56Sn4Y8tMAcvSQ/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Google Script error", details: text });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed", details: error.message });
  }
}
