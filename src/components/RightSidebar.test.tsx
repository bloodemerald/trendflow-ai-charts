import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import RightSidebar from './RightSidebar'; // Adjust path as necessary
import { useChartStore } from '@/store/chartStore'; // Adjust path as necessary
import { ChatMessage } from '@/types/types'; // Adjust path as necessary

// Mock useChartStore
vi.mock('@/store/chartStore');

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = vi.fn();

const mockAddUserMessage = vi.fn();
const mockToggleRightSidebar = vi.fn(); // Mock for toggleRightSidebar
const mockChatMessages: ChatMessage[] = [
  { id: '1', sender: 'ai', text: 'Welcome!', timestamp: new Date() },
  { id: '2', sender: 'user', text: 'Hello', timestamp: new Date() },
];

describe('RightSidebar Component', () => {
  const defaultStoreState = {
    chatMessages: mockChatMessages,
    addUserMessage: mockAddUserMessage,
    isAIAnalyzing: false,
    isRightSidebarVisible: true, // Default to visible
    toggleRightSidebar: mockToggleRightSidebar,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for useChartStore
    (useChartStore as unknown as vi.Mock).mockReturnValue(defaultStoreState);
  });

  test('renders correctly by default with initial messages and input field', () => {
    render(<RightSidebar />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about the chart...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument(); // Updated name
    expect(screen.getByRole('button', { name: /chevronleft/i })).toBeInTheDocument(); // Check for ChevronLeft
  });

  test('allows typing a message and calls addUserMessage on send', () => {
    render(<RightSidebar />);
    const inputField = screen.getByPlaceholderText('Ask about the chart...');
    const sendButton = screen.getByRole('button', { name: /send message/i }); // Updated name

    fireEvent.change(inputField, { target: { value: 'Test message' } });
    expect((inputField as HTMLInputElement).value).toBe('Test message');

    fireEvent.click(sendButton);
    expect(mockAddUserMessage).toHaveBeenCalledTimes(1);
    expect(mockAddUserMessage).toHaveBeenCalledWith('Test message');
    expect((inputField as HTMLInputElement).value).toBe(''); // Input should clear after send
  });

  test('does not call addUserMessage if message is empty or only whitespace', () => {
    render(<RightSidebar />);
    const sendButton = screen.getByRole('button', { name: /send message/i }); // Updated name

    fireEvent.click(sendButton); // Empty message
    expect(mockAddUserMessage).not.toHaveBeenCalled();

    const inputField = screen.getByPlaceholderText('Ask about the chart...');
    fireEvent.change(inputField, { target: { value: '   ' } }); // Whitespace message
    fireEvent.click(sendButton);
    expect(mockAddUserMessage).not.toHaveBeenCalled();
  });

  test('displays loading indicator when isAIAnalyzing is true', () => {
    (useChartStore as unknown as vi.Mock).mockReturnValue({
      ...defaultStoreState,
      isAIAnalyzing: true, // Set isAIAnalyzing to true
    });
    render(<RightSidebar />);
    const pulseDivs = document.querySelectorAll('.animate-pulse');
    expect(pulseDivs.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Ask about the chart...')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled(); // Updated name
  });

  test('send button is disabled when input is empty and enabled when there is text', () => {
    render(<RightSidebar />);
    const inputField = screen.getByPlaceholderText('Ask about the chart...');
    const sendButton = screen.getByRole('button', { name: /send message/i }); // Updated name

    expect(sendButton).toBeDisabled();

    fireEvent.change(inputField, { target: { value: 'Hello' } });
    expect(sendButton).not.toBeDisabled();

    fireEvent.change(inputField, { target: { value: '' } });
    expect(sendButton).toBeDisabled();
  });

  test('clicking ChevronLeft button calls toggleRightSidebar', () => {
    render(<RightSidebar />);
    const chevronButton = screen.getByRole('button', { name: /chevronleft/i });
    fireEvent.click(chevronButton);
    expect(mockToggleRightSidebar).toHaveBeenCalledTimes(1);
  });

  test('renders null if isRightSidebarVisible is false', () => {
    (useChartStore as unknown as vi.Mock).mockReturnValue({
      ...defaultStoreState,
      isRightSidebarVisible: false,
    });
    const { container } = render(<RightSidebar />);
    expect(container.firstChild).toBeNull(); // Or check for a specific class/attribute if it renders a hidden div
  });

  test('auto-scrolls to the bottom when new messages are added', () => {
    const { rerender } = render(<RightSidebar />);
    // messagesEndRef is the div with data-testid="messages-end"
    // Element.prototype.scrollIntoView is already mocked globally

    const initialScrollCount = (Element.prototype.scrollIntoView as vi.Mock).mock.calls.length;

    const newMessages: ChatMessage[] = [
      ...mockChatMessages,
      { id: '3', sender: 'ai', text: 'New AI Message', timestamp: new Date() },
    ];

    (useChartStore as unknown as vi.Mock).mockReturnValue({
      ...defaultStoreState,
      chatMessages: newMessages,
    });

    rerender(<RightSidebar />);

    expect(screen.getByText('New AI Message')).toBeInTheDocument();
    // Check if scrollIntoView was called again after rerender with new messages
    expect((Element.prototype.scrollIntoView as vi.Mock).mock.calls.length).toBeGreaterThan(initialScrollCount);
  });
});
