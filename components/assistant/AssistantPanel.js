"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { askAssistant as askAssistantApi } from "@/services/api/assistant";

import MessageBubble from "./MessageBubble";
import styles from "./assistant.module.css";


const suggestedQuestions = [
  "What is the area discrepancy?",
  "Why is this parcel high risk?",
  "Who is the recorded owner?",
  "Show ownership history",
  "What conflicts were detected?",
];

export default function AssistantPanel({ parcelId, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can help you understand the available evidence for this parcel. Ask me about ownership, area discrepancies, risk factors, conflicts, or history.",
      sources: [],
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(customQuestion) {
    const text = (customQuestion ?? question).trim();

    if (!text || loading) return;

    setError("");

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      sources: [],
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await askAssistantApi({ parcelId, question: text });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          response.answer || "No evidence-grounded answer was returned.",
        sources: response.sources || [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(err.message || "Unable to query the Evidence Assistant.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleAsk();
  }

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.assistantIdentity}>
          <div className={styles.botIcon}>
            <Bot size={19} />
          </div>

          <div>
            <strong>Evidence Assistant</strong>
            <span>
              Local evidence retrieval
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close assistant"
        >
          ×
        </button>
      </div>

      {/* Trust banner */}
      <div className={styles.trustBanner}>
        <Sparkles size={15} />

        <span>
          Answers are grounded in available parcel evidence.
        </span>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            sources={message.sources}
          />
        ))}

        {loading && (
          <div className={styles.typing}>
            <div className={styles.typingIcon}>
              <Bot size={15} />
            </div>

            <div className={styles.typingDots}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionTitle}>
            Try asking
          </div>

          {suggestedQuestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleAsk(item)}
              disabled={loading}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className={styles.inputArea}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this parcel..."
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!question.trim() || loading}
          aria-label="Send question"
        >
          <Send size={17} />
        </button>
      </form>

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        This assistant explains available evidence. It does not determine
        legal title, fraud, or final verification decisions.
      </div>
    </aside>
  );
}
