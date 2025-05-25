import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ChartControls from './ChartControls'; // Adjust path as necessary
import { useChartStore } from '@/store/chartStore'; // Adjust path as necessary

// Mock useChartStore
vi.mock('@/store/chartStore');

const mockAddUserMessage = vi.fn();
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockResetZoom = vi.fn();
const mockClearAllDrawings = vi.fn();

describe('ChartControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for useChartStore
    (useChartStore as unknown as vi.Mock).mockReturnValue({
      zoomLevel: 1,
      zoomIn: mockZoomIn,
      zoomOut: mockZoomOut,
      resetZoom: mockResetZoom,
      clearAllDrawings: mockClearAllDrawings,
      addUserMessage: mockAddUserMessage,
      isAIAnalyzing: false,
    });
  });

  test('renders all standard controls correctly', () => {
    render(<ChartControls />);
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
    expect(screen.getByTitle('Erase All Drawings')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // Zoom level
  });

  test('renders the "Analyze Chart with AI" button', () => {
    render(<ChartControls />);
    expect(screen.getByTitle('Analyze Chart with AI')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument(); // Text part of the button
  });

  test('calls addUserMessage with predefined prompt when "Analyze Chart with AI" button is clicked', () => {
    render(<ChartControls />);
    const analyzeButton = screen.getByTitle('Analyze Chart with AI');
    fireEvent.click(analyzeButton);

    expect(mockAddUserMessage).toHaveBeenCalledTimes(1);
    expect(mockAddUserMessage).toHaveBeenCalledWith(
      "Please analyze the current chart data for trends, patterns, and support/resistance levels."
    );
  });

  test('"Analyze Chart with AI" button is disabled when isAIAnalyzing is true', () => {
    (useChartStore as unknown as vi.Mock).mockReturnValue({
      zoomLevel: 1,
      zoomIn: mockZoomIn,
      zoomOut: mockZoomOut,
      resetZoom: mockResetZoom,
      clearAllDrawings: mockClearAllDrawings,
      addUserMessage: mockAddUserMessage,
      isAIAnalyzing: true, // Set isAIAnalyzing to true
    });
    render(<ChartControls />);
    const analyzeButton = screen.getByTitle('Analyze Chart with AI');
    expect(analyzeButton).toBeDisabled();
  });

  test('"Analyze Chart with AI" button is enabled when isAIAnalyzing is false', () => {
    // Default setup in beforeEach already has isAIAnalyzing: false
    render(<ChartControls />);
    const analyzeButton = screen.getByTitle('Analyze Chart with AI');
    expect(analyzeButton).not.toBeDisabled();
  });

  // Test for other buttons (zoom, erase)
  test('calls zoomIn when Zoom In button is clicked', () => {
    render(<ChartControls />);
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(mockZoomIn).toHaveBeenCalledTimes(1);
  });

  test('calls zoomOut when Zoom Out button is clicked', () => {
    render(<ChartControls />);
    fireEvent.click(screen.getByTitle('Zoom Out'));
    expect(mockZoomOut).toHaveBeenCalledTimes(1);
  });

  test('calls resetZoom when Reset Zoom button is clicked', () => {
    render(<ChartControls />);
    fireEvent.click(screen.getByTitle('Reset Zoom'));
    expect(mockResetZoom).toHaveBeenCalledTimes(1);
  });

  test('calls clearAllDrawings when Erase All Drawings button is clicked', () => {
    render(<ChartControls />);
    fireEvent.click(screen.getByTitle('Erase All Drawings'));
    expect(mockClearAllDrawings).toHaveBeenCalledTimes(1);
  });
});
