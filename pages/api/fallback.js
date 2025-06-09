export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: 'Missing userInput in request body' });
  }

  try {
    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral/mistral-7b-instruct", // You can change to another model later
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for JELD-WEN of Canada. Answer questions about windows, doors, the website, warranties, dealers, and general product info clearly and helpfully."
          },
          { role: "user", content: userInput }
        ]
      })
    });

    const data = await openrouterRes.json();

    const message = data?.choices?.[0]?.message?.content;

    if (!message) {
      return res.status(500).json({ error: 'No response from OpenRouter.' });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
