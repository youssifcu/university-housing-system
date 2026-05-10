import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAIChatContext } from '../context/AIChatContext';
import { getStoredAuthUser } from '../services/authService';
import { askAI } from '../services/aiService';
import '../styles/AIChatWidget.css';

const AIChatWidget = () => {
  const location = useLocation();
  const { screenContext } = useAIChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask me anything about housing, applications, rooms, meals, or your dashboard data.',
    },
  ]);

  const liveContext = useMemo(() => {
    const storedUser = getStoredAuthUser();

    return {
      route: location.pathname,
      currentUser: storedUser
        ? {
            id: storedUser.id || storedUser._id || null,
            name: storedUser.name || storedUser.fullName || '',
            email: storedUser.email || '',
            role: storedUser.role || 'guest',
          }
        : null,
      ...screenContext,
    };
  }, [location.pathname, screenContext]);

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', text: trimmedQuestion },
    ]);
    setQuestion('');
    setIsLoading(true);

    const answer = await askAI(trimmedQuestion, liveContext);

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'assistant', text: answer },
    ]);
    setIsLoading(false);
  };

  return (
    <div className="ai-chat-widget">
      {isOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div>
              <h3>Housing AI Assistant</h3>
              <p>Uses the current screen data to answer.</p>
            </div>
            <button
              type="button"
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
            >
              x
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ai-chat-message ${message.role}`}
              >
                {message.text}
              </div>
            ))}

            {isLoading && (
              <div className="ai-chat-message assistant">Thinking...</div>
            )}
          </div>

          <div className="ai-chat-input-row">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleAsk();
                }
              }}
              className="ai-chat-input"
              placeholder="Ask any question..."
              rows={3}
            />
            <button
              type="button"
              className="ai-chat-send"
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-chat-toggle"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        AI Chat
      </button>
    </div>
  );
};

export default AIChatWidget;
