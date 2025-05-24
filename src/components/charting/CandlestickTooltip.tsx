import React from 'react';

// Define a more specific type for the payload item if possible,
// based on the structure of data in processedData
interface PayloadData {
  timestamp: string | number; // Or Date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Add other properties if they exist in payload item's payload
}

interface CandlestickTooltipProps {
  active?: boolean;
  // Payload is an array of objects, and each object has a 'payload' property
  // which contains the actual data for that point.
  payload?: Array<{ payload: PayloadData }>;
  label?: string | number; // The label (often corresponds to the x-axis value)
}

export const CandlestickTooltip = (props: CandlestickTooltipProps) => {
  const { active, payload, label } = props;

  if (active && payload && payload.length > 0) {
    // Assuming the relevant data is in the first item of the payload array
    const data = payload[0].payload;

    // Check if data and its properties exist to prevent runtime errors
    if (!data || 
        data.open === undefined || 
        data.high === undefined || 
        data.low === undefined || 
        data.close === undefined || 
        data.volume === undefined ||
        data.timestamp === undefined) {
      return null; // Or some fallback UI
    }

    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md text-xs">
        <p className="font-medium text-sm mb-1">
          {/* Ensure label or timestamp is formatted correctly */}
          {label ? String(label) : new Date(data.timestamp).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono font-medium">${data.open.toFixed(2)}</span>
          
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono font-medium text-green-500">${data.high.toFixed(2)}</span>
          
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono font-medium text-red-500">${data.low.toFixed(2)}</span>
          
          <span className="text-muted-foreground">Close:</span>
          <span className="font-mono font-medium">${data.close.toFixed(2)}</span>
          
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-mono font-medium">{data.volume.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  
  return null; // Return null if tooltip is not active or payload is invalid
};
