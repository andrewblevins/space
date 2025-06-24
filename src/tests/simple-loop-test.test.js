/**
 * Simple test to detect the infinite loop pattern
 */

import React, { useState, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Simple Infinite Loop Detection', () => {
  let consoleSpy;
  let errorSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('should detect infinite loops from useEffect dependency issues', () => {
    let renderCount = 0;
    let effectRunCount = 0;

    const ProblematicComponent = () => {
      renderCount++;
      
      // This simulates the reasoning mode pattern that might cause loops
      const [reasoningMode, setReasoningMode] = useState(() => {
        const saved = localStorage.getItem('space_reasoning_mode');
        return saved ? saved === 'true' : false;
      });
      
      const [modalController] = useState({ id: 'test' });
      
      // This simulates the problematic useEffect pattern
      useEffect(() => {
        effectRunCount++;
        
        if (effectRunCount > 10) {
          // Prevent actual infinite loop in tests
          return;
        }
        
        console.log('🔒 Encrypted keys found, attempting to decrypt...');
        
        // Simulate what might trigger another render/effect cycle
        if (modalController) {
          // Some async operation that might change state
        }
      }, [modalController, reasoningMode]); // This dependency array could be problematic
      
      return <div data-testid="component">Renders: {renderCount}, Effects: {effectRunCount}</div>;
    };

    act(() => {
      render(<ProblematicComponent />);
    });

    // Check for excessive renders
    expect(renderCount).toBeLessThan(10);
    expect(effectRunCount).toBeLessThan(5);

    // Check for repeated console messages (sign of infinite loop)
    const encryptedMessages = consoleSpy.mock.calls.filter(
      call => call[0] && call[0].includes('🔒 Encrypted keys found')
    );
    expect(encryptedMessages.length).toBeLessThan(3);

    // Check for React warning about infinite loops
    const maxDepthErrors = errorSpy.mock.calls.filter(
      call => call[0] && call[0].includes && call[0].includes('Maximum update depth exceeded')
    );
    expect(maxDepthErrors.length).toBe(0);
  });

  test('should test stable dependency pattern', () => {
    let renderCount = 0;
    let effectRunCount = 0;

    const StableComponent = () => {
      renderCount++;
      
      // Stable initialization
      const [reasoningMode, setReasoningMode] = useState(false);
      const [modalController] = useState({ id: 'stable' });
      
      // Load from localStorage after mount (stable pattern)
      useEffect(() => {
        const saved = localStorage.getItem('space_reasoning_mode');
        if (saved) {
          setReasoningMode(saved === 'true');
        }
      }, []); // Empty dependency array
      
      // Separate effect for modal controller
      useEffect(() => {
        effectRunCount++;
        console.log('🔒 Encrypted keys found, attempting to decrypt...');
      }, [modalController]); // Only modalController as dependency
      
      return <div data-testid="stable-component">Renders: {renderCount}, Effects: {effectRunCount}</div>;
    };

    act(() => {
      render(<StableComponent />);
    });

    // Should have stable render count
    expect(renderCount).toBeLessThan(5);
    expect(effectRunCount).toBe(1); // Should only run once

    const encryptedMessages = consoleSpy.mock.calls.filter(
      call => call[0] && call[0].includes('🔒 Encrypted keys found')
    );
    expect(encryptedMessages.length).toBe(1); // Should only log once
  });

  test('should detect when useState initializer causes issues', () => {
    let renderCount = 0;
    let initializerRunCount = 0;

    const StateInitializerComponent = () => {
      renderCount++;
      
      // This pattern might cause issues if localStorage changes during render
      const [value, setValue] = useState(() => {
        initializerRunCount++;
        return localStorage.getItem('test_value') || 'default';
      });
      
      useEffect(() => {
        // If this somehow triggers a localStorage change, it could cause loops
        if (value === 'default') {
          localStorage.setItem('test_value', 'updated');
          // setValue('updated'); // This would definitely cause a loop
        }
      }, [value]);
      
      return <div>Value: {value}</div>;
    };

    act(() => {
      render(<StateInitializerComponent />);
    });

    // State initializer should only run once per component instance
    expect(initializerRunCount).toBe(1);
    expect(renderCount).toBeLessThan(5);
  });
});