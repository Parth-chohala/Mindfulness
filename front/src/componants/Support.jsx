import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Headphones, Upload } from 'lucide-react';

const Support = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there! How can I support your mindfulness journey today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(true);

  // API configuration
  const API_KEY = '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';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (shouldScroll && messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    // Scroll when messages change (new message sent or received)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle scroll events to detect manual scrolling
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // If user has scrolled up, disable auto-scrolling
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setShouldScroll(false);
    } else {
      setShouldScroll(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        API_URL,
        {
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: `You are a supportive mindfulness coach.
              Provide VERY SHORT responses (1-2 sentences maximum).
              Be direct, simple, and actionable.
              Focus on mindfulness techniques and stress reduction.
              Avoid lengthy explanations or multiple paragraphs.
              Keep your tone warm but extremely concise.`
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            userMessage
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add AI response to chat
      if (response.data.choices && response.data.choices.length > 0) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.choices[0].message.content
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Connection error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Export chat to text file
  const exportChat = () => {
    // Format the chat as text
    const chatText = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Coach' : 'You';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    // Create a blob and download link
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindfulness-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Three dots typing animation component
  const TypingAnimation = () => (
    <div className="flex space-x-2 items-center justify-center">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <div className="p-2 sm:p-4 bg-gray-800 text-white border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <Headphones className="h-5 w-5 sm:h-6 sm:w-6 text-teal-500 mr-2" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Mindfulness Support</h1>
              <p className="text-xs sm:text-sm text-gray-400">Chat with your personal mindfulness coach</p>
            </div>
          </div>
          <button
            onClick={exportChat}
            className="p-1.5 sm:p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-1"
            title="Export chat"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm hidden xs:inline">Export</span>
          </button>
        </div>

        {/* Chat messages */}
        <div
          ref={messagesContainerRef}
          className="h-[50vh] sm:h-[60vh] overflow-y-auto p-2 sm:p-4 bg-gray-900 text-white"
          onScroll={handleScroll}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 sm:mb-4 ${
                message.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 text-xs sm:text-sm ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-gray-700 text-gray-100 rounded-tl-none'
                }`}
                style={{
                  borderRadius: message.role === 'user' ? '12px 0px 12px 12px' : '0px 12px 12px 12px'
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-2 sm:mb-4">
              <div
                className="bg-gray-700 p-2 sm:p-3 rounded-tl-none flex items-center"
                style={{ borderRadius: '0px 12px 12px 12px' }}
              >
                <TypingAnimation />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-1.5 sm:p-2 text-xs sm:text-sm bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-1.5 sm:p-2 rounded-md ${
                isLoading || !input.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 sm:mt-8 bg-gray-900 rounded-lg shadow-lg p-3 sm:p-6 border border-gray-700">
        <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-white">How This Support Chat Can Help You</h2>
        <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-300">
          <li className="flex items-start">
            <span className="mr-2 text-teal-500">•</span>
            <span>Get quick mindfulness advice</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-teal-500">•</span>
            <span>Receive motivation when feeling stuck</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-teal-500">•</span>
            <span>Learn stress management techniques</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-teal-500">•</span>
            <span>Get meditation practice support</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Support;

