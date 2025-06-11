import { useState, useEffect, useRef } from "react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [intents, setIntents] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch("/api/chatbot")
      .then((res) => res.json())
      .then((data) => setIntents(data.intents))
      .catch((err) => console.error("Failed to load chatbot data:", err));
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("chatSessionId")) {
      sessionStorage.setItem("chatSessionId", generateSessionId());
    }
  }, []);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const getMetadata = () => ({
    timestamp: new Date().toISOString(),
    sessionId: sessionStorage.getItem("chatSessionId"),
    browserInfo: navigator.userAgent,
    pageUrl: window.location.href
  });

  const toggleChat = () => setIsOpen(prev => !prev);
  const refreshChat = () => {
    setMessages([]);
    setInput("");
  };

  function linkify(text) {
    const urlRegex = /\bhttps?:\/\/[^\s]+/g;
    return text.replace(urlRegex, (url) => {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${hostname}</a>`;
      } catch {
        return url;
      }
    });
  }

  function clean(text) {
    return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  }

  function similarity(a, b) {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    const editDist = levenshteinDistance(longer, shorter);
    return (longerLength - editDist) / longerLength;
  }

  function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  function tokenSimilarity(a, b) {
    const aTokens = new Set(clean(a).split(" "));
    const bTokens = new Set(clean(b).split(" "));
    const common = [...aTokens].filter(word => bTokens.has(word)).length;
    const total = new Set([...aTokens, ...bTokens]).size;
    return total === 0 ? 0 : common / total;
  }

  function findMatchingResponse(inputText) {
    if (!intents) return "Thanks for your message! We'll get back to you shortly.";

    const cleanedInput = clean(inputText);
    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.5;

    for (const intent of intents) {
      let intentScore = 0;
      for (const pattern of intent.patterns) {
        const cleanedPattern = clean(pattern);
        const tokenScore = tokenSimilarity(cleanedInput, cleanedPattern);
        const levScore = similarity(cleanedInput, cleanedPattern);
        const combinedScore = (tokenScore * 0.6 + levScore * 0.4);
        if (combinedScore > intentScore) intentScore = combinedScore;
      }
      if (intentScore > bestScore) {
        bestScore = intentScore;
        bestMatch = intent;
      }
    }

    if (bestMatch && bestScore >= threshold) {
      const randomIndex = Math.floor(Math.random() * bestMatch.responses.length);
      return bestMatch.responses[randomIndex];
    }

    return "I'm still learning and couldn't find an exact match. Can you please clarify your question?";
  }

  async function getFallbackResponse(userInput) {
    try {
      const res = await fetch("/api/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput })
      });
      const data = await res.json();
      return {
        message: data.message || "Sorry, I couldn't find an answer for that.",
        source: "chatgpt"
      };
    } catch (error) {
      console.error("Fallback error:", error);
      return {
        message: "Oops, something went wrong. Please try again.",
        source: "error"
      };
    }
  }

  async function logToGoogleSheet({ userInput, response, source }) {
    const metadata = getMetadata();
    try {
      await fetch("https://script.google.com/macros/s/AKfycbx57TdjldhTs5vVghE7uQEpr-chXyMX5VOov4RCnMa_etkJXiR6nHJr56Sn4Y8tMAcvSQ/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          response,
          source,
          ...metadata
        })
      });
    } catch (error) {
      console.error("Failed to log to Google Sheet:", error);
    }
  }

  function updateLastBotMessage(newText) {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (updated[lastIndex]?.sender === "bot") {
        updated[lastIndex].text = newText;
      }
      return updated;
    });
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    const botResponse = findMatchingResponse(input);
    setInput("");
    setMessages((prev) => [...prev, { sender: "bot", text: "Let me check that for you..." }]);

    if (
      botResponse === "I'm still learning and couldn't find an exact match. Can you please clarify your question?"
    ) {
      await logToGoogleSheet({ userInput: input, response: "", source: "unmatched" });
      const fallback = await getFallbackResponse(input);
      updateLastBotMessage(fallback.message);
      if (fallback.source === "chatgpt") {
        await logToGoogleSheet({ userInput: input, response: fallback.message, source: "chatgpt" });
      }
    } else {
      updateLastBotMessage(botResponse);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      {!isOpen && (
        <div id="chatbot-trigger" onClick={toggleChat}>
          <img src="/images/jw-logo.png" alt="JELD-WEN Logo" />
        </div>
      )}

      <div id="chatbot-container" className={isOpen ? "show" : ""}>
        <div id="chatbot-header">
          <div className="header-left">
            <div id="chatbot-logo">
              <img src="/images/jw-logo.png" alt="Logo" />
            </div>
            <div id="chatbot-title">JELD-WEN Chatbot</div>
          </div>
          <div className="header-buttons">
            <button id="minimize-btn" onClick={toggleChat}>−</button>
            <button id="refresh-btn" onClick={refreshChat}>⟳</button>
          </div>
        </div>

        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={\`message \${msg.sender}\`}
              dangerouslySetInnerHTML={{
                __html: msg.sender === "bot" ? linkify(msg.text) : msg.text,
              }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            id="user-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button id="send-btn" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
}
