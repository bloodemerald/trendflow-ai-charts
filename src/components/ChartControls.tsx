
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useChartStore } from '@/store/chartStore';

const ChartControls = () => {
  const addUserMessage = useChartStore(state => state.addUserMessage);
  const isAIAnalyzing = useChartStore(state => state.isAIAnalyzing);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addUserMessage("Please analyze the current chart data for trends, patterns, and support/resistance levels.")}
        className="h-8 w-auto p-2 flex items-center gap-1 text-xs"
        title="Analyze Chart with AI"
        disabled={isAIAnalyzing}
      >
        <Sparkles className="h-3 w-3" />
        Analyze
      </Button>
    </div>
  );
};

export default ChartControls;
