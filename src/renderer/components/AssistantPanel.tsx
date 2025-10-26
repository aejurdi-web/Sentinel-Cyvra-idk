import React, { useState } from 'react';
import { OpenAI } from '@openai/openai';
import type { StoredCredential } from '../../utils/database';

interface Props {
  credentials: StoredCredential[];
}

const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

export const AssistantPanel: React.FC<Props> = ({ credentials }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Hi! I am Sentinel AI. Ask me about password strength, automation logs, or request a strong password suggestion.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
          ...nextMessages.map(message => ({ role: message.role, content: message.content })),
          {
            role: 'system',
            content: `You are Sentinel AI. You know about the following accounts: ${credentials
              .map(c => `${c.name} (${c.username}) - status ${c.breachStatus}`)
              .join('; ')}`
          }
        ]
      });
      const text = response.output_text ?? 'I was unable to generate a response.';
      setMessages([...nextMessages, { role: 'assistant', content: text }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'There was an error contacting OpenAI. Check your API key and network connection.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="text-sm font-semibold text-slate-400">Sentinel AI Assistant</h3>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-lg p-3 text-sm ${
              message.role === 'assistant'
                ? 'bg-primary/10 text-slate-100'
                : 'bg-slate-800/80 text-slate-200'
            }`}
          >
            <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-2">
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Ask about security posture..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
        />
        <button
          disabled={loading}
          onClick={sendMessage}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default AssistantPanel;
