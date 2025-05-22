
import React, { useState, useRef, useEffect } from 'react';
import { useChartStore } from '@/store/chartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send } from 'lucide-react';

const RightSidebar = () => {
  const { chatMessages, addUserMessage, addAIMessage, isAIAnalyzing, symbol } = useChartStore();
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
    
    addUserMessage(inputMessage);
    setInputMessage('');
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        `Based on the ${symbol} chart, I can see a potential bullish pattern forming. The recent price action shows increased buying pressure.`,
        `Looking at the current ${symbol} chart, there appears to be a double top pattern, which is typically bearish. Consider waiting for confirmation before taking action.`,
        `The ${symbol} chart shows strong support at the current level with increasing volume. This could indicate accumulation phase.`,
        `I've analyzed the ${symbol} chart and noticed a bearish divergence in the RSI indicator. This often precedes a price correction.`,
        `The recent candlestick patterns on ${symbol} suggest indecision in the market. It might be best to wait for a clearer signal before making any trades.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addAIMessage(randomResponse);
    }, 1500);
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
        
        <div ref={messagesEndRef} />
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
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RightSidebar;
