
import React, { useState, useRef, useEffect } from 'react';
import { useChartStore } from '@/store/chartStore'; // Make sure useChartStore is correctly imported
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send } from 'lucide-react';

const RightSidebar = () => {
  // Removed addAIMessage and symbol as they are not directly used here anymore
  const { chatMessages, addUserMessage, isAIAnalyzing } = useChartStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    addUserMessage(inputMessage); // This will now trigger the AI response via chartStore
    setInputMessage('');
    // The simulated AI response (setTimeout and addAIMessage call) is removed.
    // The actual AI response is handled by the updated addUserMessage in chartStore.
  };

  return (
    <div className="w-80 h-full bg-sidebar border-l border-chart-grid flex flex-col">
      <div className="p-3 border-b border-chart-grid flex items-center">
        <h2 className="text-sm font-medium flex-1">AI Assistant</h2>
        <button className="w-6 h-6 flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chatMessages.map((message) => (
          <div 
            key={message.id} 
            className={`message-bubble ${message.sender === 'user' ? 'message-user' : 'message-ai'}`}
          >
            <p className="text-sm">{message.text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        
        {isAIAnalyzing && (
          <div className="message-bubble message-ai">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} data-testid="messages-end" />
      </div>
      
      <div className="p-3 border-t border-chart-grid">
        <form onSubmit={handleSubmit} className="flex">
          <Input
            type="text"
            placeholder="Ask about the chart..."
            className="flex-1 bg-secondary"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isAIAnalyzing}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2" 
            disabled={isAIAnalyzing || !inputMessage.trim()}
            aria-label="Send message" // Added aria-label
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RightSidebar;
