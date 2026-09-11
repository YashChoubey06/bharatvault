"use client";

import { Bot, User } from "lucide-react";
import SourceCitation from "./SourceCitation";
import styles from "./assistant.module.css";

export default function MessageBubble({
  role,
  content,
  sources = [],
}) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={`${styles.messageRow} ${
        isAssistant
          ? styles.messageRowAssistant
          : styles.messageRowUser
      }`}
    >
      {isAssistant && (
        <div className={styles.messageAvatar}>
          <Bot size={14} />
        </div>
      )}

      <div
        className={`${styles.messageBubble} ${
          isAssistant
            ? styles.assistantBubble
            : styles.userBubble
        }`}
      >
        <p>{content}</p>

        {isAssistant && sources.length > 0 && (
          <div className={styles.sources}>
            <div className={styles.sourcesTitle}>
              Evidence sources
            </div>

            {sources.map((source, index) => (
              <SourceCitation
                key={`${source.documentId || "source"}-${index}`}
                source={source}
              />
            ))}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className={styles.messageAvatarUser}>
          <User size={14} />
        </div>
      )}
    </div>
  );
}