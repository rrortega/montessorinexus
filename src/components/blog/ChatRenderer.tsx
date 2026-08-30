import React from 'react';
import { User, MessageCircle } from 'lucide-react';

interface ChatMessage {
  speaker: string;
  text: string;
  isFirstSpeaker: boolean;
}

export function parseChatDialogue(text: string): ChatMessage[] | null {
  if (!text || typeof text !== 'string') return null;
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const messages: ChatMessage[] = [];
  let firstSpeakerName = '';

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      // Continuation of previous message
      if (messages.length > 0) {
        messages[messages.length - 1].text += ' ' + line;
      }
      continue;
    }

    const speaker = line.substring(0, colonIdx).trim().replace(/^[-*•]\s*/, '').replace(/[*_]/g, '');
    const messageText = line.substring(colonIdx + 1).trim();

    if (!speaker || !messageText) continue;

    if (!firstSpeakerName) {
      firstSpeakerName = speaker.toLowerCase();
    }

    const isFirstSpeaker = speaker.toLowerCase() === firstSpeakerName;
    messages.push({ speaker, text: messageText, isFirstSpeaker });
  }

  return messages.length > 0 ? messages : null;
}

interface ChatRendererProps {
  messages: ChatMessage[];
  isSaaSBlog?: boolean;
}

export const ChatRenderer: React.FC<ChatRendererProps> = ({ messages, isSaaSBlog }) => {
  return (
    <div className="my-8 w-full rounded-3xl border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border/60 text-xs">
        <MessageCircle className={`w-4 h-4 ${isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'}`} />
        <span className="font-display font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 text-xs">
          Diálogo Pedagógico
        </span>
      </div>

      {/* Messages Thread */}
      <div className="p-4 sm:p-6 space-y-4 bg-muted/10">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end gap-2.5 ${
              msg.isFirstSpeaker ? 'justify-start' : 'justify-end'
            }`}
          >
            {msg.isFirstSpeaker && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                isSaaSBlog
                  ? 'bg-[#C4661F]/15 text-[#C4661F]'
                  : 'bg-forest/15 text-forest'
              }`}>
                {msg.speaker.charAt(0).toUpperCase()}
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
              msg.isFirstSpeaker
                ? 'bg-white dark:bg-stone-900 border border-border/80 text-foreground rounded-bl-xs'
                : isSaaSBlog
                  ? 'bg-[#C4661F] text-white rounded-br-xs'
                  : 'bg-forest text-white rounded-br-xs'
            }`}>
              <span className={`block text-[11px] font-bold mb-1 ${
                msg.isFirstSpeaker
                  ? isSaaSBlog ? 'text-[#C4661F]' : 'text-forest'
                  : 'text-white/80'
              }`}>
                {msg.speaker}
              </span>
              <span>{msg.text}</span>
            </div>

            {!msg.isFirstSpeaker && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                isSaaSBlog
                  ? 'bg-[#C4661F]/20 text-[#C4661F]'
                  : 'bg-forest/20 text-forest'
              }`}>
                {msg.speaker.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRenderer;
