
import { ChatMessage, ChartData } from '../types/types';

// Updated analyzeChartData to format the last N data points
async function analyzeChartData(chartData: ChartData[], count: number = 50): Promise<string> {
  if (chartData.length === 0) {
    return "No chart data available.";
  }
  const recentData = chartData.slice(-count); // Get the last 'count' data points
  
  // Format each data point
  const formattedData = recentData.map(data => 
    `Timestamp: ${data.timestamp}, Open: ${data.open.toFixed(2)}, High: ${data.high.toFixed(2)}, Low: ${data.low.toFixed(2)}, Close: ${data.close.toFixed(2)}, Volume: ${data.volume}`
  ).join('\n');

  if (formattedData.length === 0) {
    return "No recent chart data to display.";
  }
  return `\n${formattedData}`;
}

export async function getAIResponse(chatMessages: ChatMessage[], chartData: ChartData[]): Promise<string> {
  const GEMINI_API_KEY = "AIzaSyBHjClGIarRwpPH06imDJ43eSGU2rTIC6E"; // Your provided API key

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    return "Error: GEMINI_API_KEY is not configured.";
  }

  const lastMessages = chatMessages.slice(-5).map(msg => `${msg.sender}: ${msg.text}`).join('\n');
  // Pass the full chartData to analyzeChartData, it will take the last 50 points
  const detailedChartData = await analyzeChartData(chartData);

  const prompt = `
    You are an expert trading analyst AI. Your goal is to help users by analyzing financial chart data and recent conversation history.

    Here is the recent chat history:
    ${lastMessages}

    Here is the recent chart data (last 50 periods, most recent last):
    ${detailedChartData}

    Please analyze this data and provide a well-structured response using the following format:

    📊 **MARKET TREND**
    [Identify current trend: bullish/bearish/sideways with brief explanation]

    📈 **KEY LEVELS**
    • Support: [price level and reasoning]
    • Resistance: [price level and reasoning]

    🔍 **TECHNICAL PATTERNS**
    [Identify any chart patterns like head & shoulders, triangles, channels, etc.]

    ⚡ **TRADING SIGNALS**
    [Provide specific actionable insights or potential entry/exit points]

    🎯 **SUMMARY**
    [2-3 sentence conclusion with the most important takeaway]

    Keep each section concise and professional. Use bullet points where appropriate.
    
    AI Analyst:
  `;

  try {
    // Changed from require to import
    const { GoogleGenerativeAI } = await import("@google/generative-ai"); 
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); 
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"}); // Updated model name
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    console.error("Full error object from Gemini API:", JSON.stringify(error, null, 2));
    return 'Error fetching AI response.';
  }
}
