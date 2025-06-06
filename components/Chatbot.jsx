import { useState, useEffect, useRef } from "react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [intents, setIntents] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch intents from backend API once
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
    setIsOpen((prev) => !prev);
  };

  const refreshChat = () => {
    setMessages([]);
    setInput("");
  };

  function findMatchingResponse(inputText) {
    if (!intents) return "Thanks for your message! We'll get back to you shortly.";

    inputText = inputText.toLowerCase();
    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (inputText.includes(pattern)) {
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
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      {/* Trigger button */}
      {!isOpen && (
        <div id="chatbot-trigger" onClick={toggleChat}>
          <img src="/images/jw-logo.png" alt="JELD-WEN Logo" />
        </div>
      )}

      {/* Chat container */}
      <div id="chatbot-container" className={isOpen ? "show" : ""}>
        {/* Header */}
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

        {/* Messages */}
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
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
