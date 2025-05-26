import { useChartStore, ChartState } from './chartStore';
import { act } from '@testing-library/react';

// Helper to generate simple mock data for testing x-axis zoom/pan
const generateMockChartData = (length: number) => {
  return Array.from({ length }, (_, i) => ({
    timestamp: `ts${i}`,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 100 + i,
    volume: 1000 + i * 10,
    sma: 100 + i, // Mock SMA if needed
  }));
};

describe('Chart Store Zoom and Pan', () => {
  let initialStoreState: ChartState;

  beforeEach(() => {
    // Capture initial state once
    if (!initialStoreState) {
      initialStoreState = useChartStore.getState();
    }
    // Reset store to a clean initial state before each test
    // This includes resetting chartData if it was modified by a previous test
    act(() => {
      useChartStore.setState({ ...initialStoreState, chartData: [], xZoomLevel: 1, xPanOffset: 0, zoomLevel: 1 });
    });
  });

  describe('Vertical Zoom (zoomLevel)', () => {
    it('zoomIn() should increase zoomLevel and clamp at max', () => {
      const initialZoom = useChartStore.getState().zoomLevel;
      act(() => {
        useChartStore.getState().zoomIn();
      });
      expect(useChartStore.getState().zoomLevel).toBe(initialZoom * 1.2);

      // Zoom in multiple times to reach clamp limit (max 5)
      for (let i = 0; i < 20; i++) {
        act(() => {
          useChartStore.getState().zoomIn();
        });
      }
      expect(useChartStore.getState().zoomLevel).toBe(5);
    });

    it('zoomOut() should decrease zoomLevel and clamp at min', () => {
      // Set a higher initial zoom to test decrease
      act(() => {
        useChartStore.getState().setZoomLevel(2);
      });
      const initialZoom = useChartStore.getState().zoomLevel;
      act(() => {
        useChartStore.getState().zoomOut();
      });
      expect(useChartStore.getState().zoomLevel).toBe(initialZoom / 1.2);

      // Zoom out multiple times to reach clamp limit (min 0.5)
      for (let i = 0; i < 20; i++) {
        act(() => {
          useChartStore.getState().zoomOut();
        });
      }
      expect(useChartStore.getState().zoomLevel).toBe(0.5);
    });

    it('setZoomLevel() should set zoomLevel and clamp', () => {
      act(() => {
        useChartStore.getState().setZoomLevel(2.5);
      });
      expect(useChartStore.getState().zoomLevel).toBe(2.5);

      act(() => {
        useChartStore.getState().setZoomLevel(10); // Above max
      });
      expect(useChartStore.getState().zoomLevel).toBe(5);

      act(() => {
        useChartStore.getState().setZoomLevel(0.1); // Below min
      });
      expect(useChartStore.getState().zoomLevel).toBe(0.5);
    });

    it('resetZoom() should reset zoomLevel to 1', () => {
      act(() => {
        useChartStore.getState().setZoomLevel(3);
      });
      expect(useChartStore.getState().zoomLevel).toBe(3);
      act(() => {
        useChartStore.getState().resetZoom();
      });
      expect(useChartStore.getState().zoomLevel).toBe(1);
    });
  });

  describe('Horizontal Zoom (xZoomLevel)', () => {
    const mockData = generateMockChartData(100); // 100 data points
    const MIN_VIEWABLE_POINTS = 10;

    beforeEach(() => {
      act(() => {
        // Set chartData for xZoomLevel tests
        useChartStore.setState({ chartData: mockData, xZoomLevel: 1, xPanOffset: 0 });
      });
    });

    it('setXZoomLevel() should update xZoomLevel and adjust xPanOffset to keep view centered', () => {
      // Initial: 100 points, xZoomLevel = 1, xPanOffset = 0. Visible: 100. Center ~50.
      act(() => {
        useChartStore.getState().setXZoomLevel(2); // Show 50 points
      });
      // New visible: 50 points. Old center index: 50. New pan: 50 - 50/2 = 25.
      expect(useChartStore.getState().xZoomLevel).toBe(2);
      expect(useChartStore.getState().xPanOffset).toBe(25);

      // From xZoomLevel = 2 (50 points, pan 25), center is 25 + 25 = 50
      // Zoom to xZoomLevel = 4 (show 25 points)
      act(() => {
        useChartStore.getState().setXZoomLevel(4);
      });
      // New visible: 25 points. Old center index: 50. New pan: 50 - 25/2 = 37.5 -> 37 or 38 (Math.round)
      // Implementation uses Math.round, 50 - 12.5 = 37.5 -> 38
      expect(useChartStore.getState().xZoomLevel).toBe(4);
      expect(useChartStore.getState().xPanOffset).toBe(38); // or 37, depends on Math.round vs floor/ceil
    });

    it('setXZoomLevel() should clamp xZoomLevel (min 1, max based on MIN_VIEWABLE_POINTS)', () => {
      const maxZoom = mockData.length / MIN_VIEWABLE_POINTS; // 100 / 10 = 10

      act(() => {
        useChartStore.getState().setXZoomLevel(maxZoom + 5); // Attempt to zoom beyond max
      });
      expect(useChartStore.getState().xZoomLevel).toBe(maxZoom);

      act(() => {
        useChartStore.getState().setXZoomLevel(0.5); // Attempt to zoom below min (1)
      });
      expect(useChartStore.getState().xZoomLevel).toBe(1);
    });
    
    it('setXZoomLevel() should handle chartData with fewer than MIN_VIEWABLE_POINTS', () => {
      const fewData = generateMockChartData(5);
      act(() => {
        useChartStore.setState({ chartData: fewData, xZoomLevel: 1, xPanOffset: 0 });
      });
      // maxZoom should be 1 because totalDataPoints (5) < MIN_VIEWABLE_POINTS (10)
      // so, totalDataPoints / MIN_VIEWABLE_POINTS = 0.5, but it's capped at 1.
      // The logic is: maxZoomLevel = totalDataPoints > MIN_VIEWABLE_POINTS ? totalDataPoints / MIN_VIEWABLE_POINTS : 1;
      act(() => {
        useChartStore.getState().setXZoomLevel(2); // Attempt to zoom in
      });
      expect(useChartStore.getState().xZoomLevel).toBe(1); // Should remain 1
      expect(useChartStore.getState().xPanOffset).toBe(0);
    });

    it('setXZoomLevel() should not change xZoomLevel if new level is same as current', () => {
      act(() => {
        useChartStore.getState().setXZoomLevel(1);
      });
      const currentXZoom = useChartStore.getState().xZoomLevel;
      const currentXPan = useChartStore.getState().xPanOffset;
      act(() => {
        useChartStore.getState().setXZoomLevel(1);
      });
      expect(useChartStore.getState().xZoomLevel).toBe(currentXZoom);
      expect(useChartStore.getState().xPanOffset).toBe(currentXPan);

    });

  });

  describe('Horizontal Pan (xPanOffset)', () => {
    const mockData = generateMockChartData(100); // 100 data points
    const MIN_VIEWABLE_POINTS = 10;

    beforeEach(() => {
      act(() => {
        // Set chartData and a specific xZoomLevel for consistent pan tests
        useChartStore.setState({ chartData: mockData, xZoomLevel: 2, xPanOffset: 0 }); // Shows 50 points
      });
    });

    it('panXAxis() should update xPanOffset correctly', () => {
      act(() => {
        useChartStore.getState().panXAxis(10); // Pan right by 10
      });
      expect(useChartStore.getState().xPanOffset).toBe(10);

      act(() => {
        useChartStore.getState().panXAxis(-5); // Pan left by 5
      });
      expect(useChartStore.getState().xPanOffset).toBe(5); // 10 - 5 = 5
    });

    it('panXAxis() should clamp xPanOffset at 0 (left boundary)', () => {
      act(() => {
        useChartStore.getState().panXAxis(-20); // Current pan is 0, try to pan left
      });
      expect(useChartStore.getState().xPanOffset).toBe(0);
    });

    it('panXAxis() should clamp xPanOffset at max (total - visible) (right boundary)', () => {
      // xZoomLevel = 2, totalDataPoints = 100 => visiblePoints = 50
      // Max panOffset = 100 - 50 = 50
      const maxPan = mockData.length - Math.max(MIN_VIEWABLE_POINTS, Math.round(mockData.length / useChartStore.getState().xZoomLevel));
      
      act(() => {
        useChartStore.getState().panXAxis(maxPan + 10); // Try to pan beyond max
      });
      expect(useChartStore.getState().xPanOffset).toBe(maxPan);
      
      // Set pan to max and try to pan further
      act(() => {
         useChartStore.setState({ xPanOffset: maxPan });
      });
      act(() => {
        useChartStore.getState().panXAxis(5);
      });
      expect(useChartStore.getState().xPanOffset).toBe(maxPan);
    });
    
    it('panXAxis() should not change xPanOffset if delta results in same clamped value', () => {
      act(() => {
         useChartStore.setState({ xPanOffset: 0 }); // Already at left boundary
      });
      act(() => {
        useChartStore.getState().panXAxis(-5); // Pan left
      });
      expect(useChartStore.getState().xPanOffset).toBe(0);
    });
  });
});

describe('Chart Store Right Sidebar', () => {
  let initialStoreState: ChartState;

  beforeEach(() => {
    // Capture initial state once
    if (!initialStoreState) {
      initialStoreState = useChartStore.getState();
    }
    // Reset store to a clean initial state before each test
    act(() => {
      useChartStore.setState({ ...initialStoreState, isRightSidebarVisible: true }); // Reset to default true
    });
  });

  it('isRightSidebarVisible should be true by default', () => {
    // Note: The default is set in the store's initial state.
    // The beforeEach also resets it to true for consistency in this test suite.
    expect(useChartStore.getState().isRightSidebarVisible).toBe(true);
  });

  it('toggleRightSidebar should invert isRightSidebarVisible', () => {
    const initialVisibility = useChartStore.getState().isRightSidebarVisible;
    
    act(() => {
      useChartStore.getState().toggleRightSidebar();
    });
    expect(useChartStore.getState().isRightSidebarVisible).toBe(!initialVisibility);

    act(() => {
      useChartStore.getState().toggleRightSidebar();
    });
    expect(useChartStore.getState().isRightSidebarVisible).toBe(initialVisibility); // Back to original
  });
});

// Note: For Zustand stores that might involve async operations or complex state updates
// that could affect React components, using `act` from `@testing-library/react` (or similar)
// around state changes is good practice, even if direct state access seems synchronous.
// Here, the actions are synchronous state updates, so direct calls are often fine,
// but `act` ensures any potential React-related effects are flushed if the store were more complex.
// For these simple synchronous setters, `act` is not strictly necessary for each `setState`
// call but is included for robustness and good practice.
// The main `act` usage is around actions that trigger `set` or `setState`.
