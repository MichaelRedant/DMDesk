import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage, FocusType, Mode } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  mode: Mode;
  isLoading: boolean;
  onSend: (message: string) => void;
  focus: FocusType;
  onFocusChange: (focus: FocusType) => void;
}

export function ChatPanel({ messages, mode, isLoading, onSend, focus, onFocusChange }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section className="chat-panel">
      <div className="chat-log">
        {messages.length === 0 && (
          <div className="empty">
            <p>
              {mode === 'rules'
                ? 'Stel een RAW-vraag over je regels, bijv. "Wat zeggen mijn regels over stealth in licht obscurement?"'
                : 'Vraag om verhaaltjes of NPC-inspiratie, bijv. "Geef 3 hooks voor een dwarven ruin in de Forgotten Realms."'}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <article key={msg.id} className={`chat-message ${msg.role}`}>
            <p className="muted small">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            <div className="bubble">
              <p>{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  <p className="muted small">Bronnen:</p>
                  <ul>
                    {msg.sources.map((source, idx) => (
                      <li key={idx}>
                        <span className="pill">{source.fileName}</span>
                        {source.heading ? <span className="muted small"> – {source.heading}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="chat-meta">
          <div className="pill muted">{mode === 'rules' ? 'Q&A (Regels/Lore)' : 'Story tools'}</div>
          <select
            className="focus-select"
            value={focus}
            onChange={(e) => onFocusChange(e.target.value as FocusType)}
            title="Focust de retrieval op een type onderwerp"
          >
            <option value="general">Algemeen</option>
            <option value="class">Class</option>
            <option value="rule">Regel</option>
            <option value="monster">Monster</option>
            <option value="background">Background</option>
            <option value="feat">Feat</option>
            <option value="race">Ras</option>
            <option value="spell">Spell</option>
            <option value="item">Item</option>
          </select>
        </div>
        <textarea
          placeholder={mode === 'rules' ? 'Stel je regelsvraag...' : 'Beschrijf je improvisatievraag...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
        />
        <div className="chat-actions">
          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Denken...' : 'Vraag'}
          </button>
        </div>
      </form>
    </section>
  );
}
