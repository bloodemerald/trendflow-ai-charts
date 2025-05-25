import { vi } from 'vitest';
// Do not import getAIResponse here directly, it will be imported dynamically

// Mock the @google/generative-ai module
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
  // This is the factory function for the module mock
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => {
      // Constructor mock for GoogleGenerativeAI
      return {
        // Mock for getGenerativeModel method
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: mockGenerateContent, // Ensure this mock is returned
        }),
      };
    }),
  };
});

// Store original process.env
const originalEnv = { ...process.env };

describe('AI Service - getAIResponse', () => {
  beforeEach(async () => {
    vi.resetModules(); // Reset modules to allow re-importing with fresh state
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' }; // Set default mock API key
    mockGenerateContent.mockReset(); // Reset the mock function state before each test
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env after all tests
  });

  const sampleChatMessages: ChatMessage[] = [
    { id: '1', sender: 'user', text: 'Hello AI', timestamp: new Date() },
    { id: '2', sender: 'ai', text: 'Hello User', timestamp: new Date() },
  ];

  const sampleChartData: ChartData[] = [
    { timestamp: '2023-01-01T00:00:00.000Z', open: 100, high: 105, low: 99, close: 102, volume: 1000 },
    { timestamp: '2023-01-01T00:01:00.000Z', open: 102, high: 108, low: 101, close: 105, volume: 1200 },
  ];

  test('should return error if GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const { getAIResponse } = await import('./aiService');
    const response = await getAIResponse(sampleChatMessages, sampleChartData);
    expect(response).toBe("Error: GEMINI_API_KEY is not configured.");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  test('should construct the prompt correctly and call generateContent', async () => {
    const { getAIResponse } = await import('./aiService');
    const mockResponseText = 'AI analysis complete.';
    mockGenerateContent.mockResolvedValue({
      response: { text: () => mockResponseText },
    });

    await getAIResponse(sampleChatMessages, sampleChartData);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
    
    expect(calledPrompt).toContain("You are an expert trading analyst AI.");
    expect(calledPrompt).toContain("Here is the recent chat history:");
    expect(calledPrompt).toContain("user: Hello AI");
    expect(calledPrompt).toContain("ai: Hello User");
    expect(calledPrompt).toContain("Here is the recent chart data (last 50 periods, most recent last):");
    expect(calledPrompt).toContain("Timestamp: 2023-01-01T00:00:00.000Z, Open: 100.00, High: 105.00, Low: 99.00, Close: 102.00, Volume: 1000");
    expect(calledPrompt).toContain("Timestamp: 2023-01-01T00:01:00.000Z, Open: 102.00, High: 108.00, Low: 101.00, Close: 105.00, Volume: 1200");
    expect(calledPrompt).toContain("Please analyze this data along with the recent chat history to:");
    expect(calledPrompt).toContain("AI Analyst:");
  });

  test('should return AI response when API call is successful', async () => {
    const { getAIResponse } = await import('./aiService');
    const mockResponseText = 'Successful AI response.';
    mockGenerateContent.mockResolvedValue({
      response: { text: () => mockResponseText },
    });

    const response = await getAIResponse(sampleChatMessages, sampleChartData);
    expect(response).toBe(mockResponseText);
  });

  test('should handle API errors gracefully', async () => {
    const { getAIResponse } = await import('./aiService');
    mockGenerateContent.mockRejectedValue(new Error('API Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await getAIResponse(sampleChatMessages, sampleChartData);
    expect(response).toBe('Error fetching AI response.');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error calling Gemini API:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  test('analyzeChartData formatting is reflected in the prompt', async () => {
    const { getAIResponse } = await import('./aiService');
    const mockResponseText = 'Data formatted.';
    mockGenerateContent.mockResolvedValue({
      response: { text: () => mockResponseText },
    });

    // Test with empty chart data
    await getAIResponse(sampleChatMessages, []);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    let calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("No chart data available.");

    // Reset mock for the next call within the same test
    mockGenerateContent.mockReset();
    // Re-setup mock resolved value for the next call
    mockGenerateContent.mockResolvedValue({
        response: { text: () => mockResponseText },
    });


    // Test with single chart data point
    await getAIResponse(sampleChatMessages, sampleChartData.slice(0,1));
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(calledPrompt).toContain("Timestamp: 2023-01-01T00:00:00.000Z, Open: 100.00, High: 105.00, Low: 99.00, Close: 102.00, Volume: 1000");
    expect(calledPrompt).not.toContain("Timestamp: 2023-01-01T00:01:00.000Z");
  });
});

// Define types here or import from actual types file if not already
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
