import { ChatMessage, ChartData } from '../types/types';

// Configure the Gemini API key
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Will be accessed directly in getAIResponse

// if (!GEMINI_API_KEY) { // This check will also move into getAIResponse
//   console.error('GEMINI_API_KEY is not set in environment variables.');
// }

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
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Access API key inside the function

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
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

    Please analyze this data along with the recent chat history to:
    1. Identify the current market trend (e.g., bullish, bearish, sideways).
    2. Determine key support and resistance levels.
    3. Spot any basic chart patterns (e.g., head and shoulders, double top/bottom, triangles, channels).
    4. Provide potential trading signals or noteworthy insights based on your analysis.
    Respond clearly and concisely.
    
    AI Analyst:
  `;

  try {
    // NOTE: This is a placeholder for the actual API call.
    // You will need to replace this with the actual Gemini API client library or fetch call.
    // Example using a hypothetical Gemini API client:
    
    // Changed from require to import
    const { GoogleGenerativeAI } = await import("@google/generative-ai"); 
    // Initialize Gemini AI client here to use the potentially mocked GEMINI_API_KEY
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); 
    const model = genAI.getGenerativeModel({ model: "gemini-pro"}); // Or your desired model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    

    // For now, returning a mocked response:
    // console.log("Constructed Prompt for AI:", prompt); // Log the prompt for debugging
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay
    // return "This is a mocked AI response. Implement actual API call to Gemini.";

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Error fetching AI response.';
  }
}
