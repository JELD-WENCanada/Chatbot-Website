
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
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setIntents(data.intents);
      })
      .catch((err) => console.error("Failed to load chatbot data:", err));
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const refreshChat = () => {
    setMessages([]);
    setInput("");
  };

  function findMatchingResponse(input) {
    if (!intents) return "Thanks for your message! We'll get back to you shortly.";

    input = input.toLowerCase();
    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (input.includes(pattern)) {
          const randomIndex = Math.floor(Math.random() * intent.responses.length);
          return intent.responses[randomIndex];
        }
      }
    }

    return "Thanks for your message! We'll get back to you shortly.";
  }

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    const botResponse = findMatchingResponse(input);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 500);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <div id="chatbot-trigger" className="chatbot-trigger" onClick={toggleChat}>
          <img src="/images/jw-logo.png" alt="JELD-WEN Logo" />
        </div>
      )}

      <div id="chatbot-container" className={`chatbot-container ${isOpen ? "show" : ""}`}>
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
            <div key={i} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
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
