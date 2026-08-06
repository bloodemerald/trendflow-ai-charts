import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, ChartData } from "../types/types";

function formatRecentChartData(chartData: ChartData[], count = 50): string {
  if (chartData.length === 0) {
    return "No chart data available.";
  }

  return chartData
    .slice(-count)
    .map(
      (data) =>
        `Timestamp: ${data.timestamp}, Open: ${data.open.toFixed(2)}, High: ${data.high.toFixed(2)}, Low: ${data.low.toFixed(2)}, Close: ${data.close.toFixed(2)}, Volume: ${data.volume}`,
    )
    .join("\n");
}

export async function getAIResponse(
  chatMessages: ChatMessage[],
  chartData: ChartData[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not configured.");
    return "AI analysis is unavailable. Add VITE_GEMINI_API_KEY to your local environment file.";
  }

  const recentConversation = chatMessages
    .slice(-5)
    .map((message) => `${message.sender}: ${message.text}`)
    .join("\n");
  const recentChartData = formatRecentChartData(chartData);

  const prompt = `
You are an expert trading analyst AI. Analyze the supplied financial chart data and recent conversation history.

Recent chat history:
${recentConversation || "No recent messages."}

Recent chart data (last 50 periods, newest last):
${recentChartData}

Respond using this structure:

📊 **MARKET TREND**
Identify the current trend as bullish, bearish, or sideways and briefly explain why.

📈 **KEY LEVELS**
• Support: price level and reasoning
• Resistance: price level and reasoning

🔍 **TECHNICAL PATTERNS**
Identify relevant chart patterns, if any.

⚡ **TRADING SIGNALS**
Provide concise, evidence-based scenarios rather than guarantees.

🎯 **SUMMARY**
Give a two- or three-sentence conclusion with the main takeaway.
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "The AI analysis request failed. Check your API key and try again.";
  }
}
