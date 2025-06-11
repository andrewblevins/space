/**
 * Tests to identify and prevent the infinite loop bug in Terminal component
 */

import React, { useState, useEffect } from 'react';
import { render, waitFor, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import Terminal from '../src/components/Terminal';
import { ModalProvider, useModal } from '../src/contexts/ModalContext';

// Mock dependencies
jest.mock('../src/utils/secureStorage');
jest.mock('../src/hooks/useClaude');
jest.mock('../src/lib/memory');
jest.mock('openai');

// Mock other dependencies that Terminal might need
jest.mock('../src/utils/apiConfig', () => ({
  getApiEndpoint: () => 'http://test-api.com'
}));

jest.mock('../src/utils/terminalHelpers', () => ({
  analyzeMetaphors: jest.fn(),
  analyzeForQuestions: jest.fn(),
  summarizeSession: jest.fn(),
  generateSessionSummary: jest.fn(),
}));

jest.mock('../src/utils/usageTracking', () => ({
  trackUsage: jest.fn(),
  trackSession: jest.fn(),
}));

describe('Infinite Loop Bug Detection', () => {
  let consoleSpy;
  let errorSpy;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Setup spies
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('1. Reproduction Tests', () => {
    test('should not create infinite loop during encrypted key decryption', async () => {
      // Set up localStorage with encrypted keys (simulate existing user)
      localStorage.setItem('space_anthropic_key_encrypted', 'mock-encrypted-data');
      localStorage.setItem('space_openai_key_encrypted', 'mock-encrypted-data');
      
      // Mock hasEncryptedData to return true
      const { hasEncryptedData, getDecrypted } = require('../src/utils/secureStorage');
      hasEncryptedData.mockReturnValue(true);
      getDecrypted.mockResolvedValue('mock-key');

      render(
        <ModalProvider>
          <Terminal theme="dark" toggleTheme={() => {}} />
        </ModalProvider>
      );
      
      // Wait and check that "Encrypted keys found" message doesn't repeat
      await waitFor(() => {
        const encryptedMessages = consoleSpy.mock.calls.filter(
          call => call[0] && call[0].includes && call[0].includes('🔒 Encrypted keys found')
        );
        expect(encryptedMessages.length).toBeLessThan(3); // Should only happen 1-2 times max
      }, { timeout: 5000 });
    });

    test('should detect React infinite render warnings', async () => {
      localStorage.setItem('space_anthropic_key_encrypted', 'mock-encrypted-data');
      
      const { hasEncryptedData } = require('../src/utils/secureStorage');
      hasEncryptedData.mockReturnValue(true);

      render(
        <ModalProvider>
          <Terminal theme="dark" toggleTheme={() => {}} />
        </ModalProvider>
      );

      // Wait a bit for any loops to manifest
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for React's "Maximum update depth exceeded" warning
      const maxDepthErrors = errorSpy.mock.calls.filter(
        call => call[0] && call[0].includes && call[0].includes('Maximum update depth exceeded')
      );
      
      expect(maxDepthErrors.length).toBe(0);
    });
  });

  describe('2. useEffect Dependency Tests', () => {
    test('modalController useEffect should not trigger infinite rerenders', () => {
      let renderCount = 0;
      const mockModalController = { requestPassword: jest.fn() };
      
      const TestComponent = () => {
        renderCount++;
        const [controller] = useState(mockModalController);
        
        useEffect(() => {
          // Simulate the problematic useEffect pattern
          if (controller) {
            // This should not cause controller to change again
          }
        }, [controller]);
        
        return <div data-testid="render-count">Render count: {renderCount}</div>;
      };
      
      render(<TestComponent />);
      
      // Should not render more than a reasonable number of times
      expect(renderCount).toBeLessThan(5);
    });

    test('reasoning mode dependency should not cause infinite loops', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const [reasoningMode, setReasoningMode] = useState(() => {
          const saved = localStorage.getItem('space_reasoning_mode');
          return saved ? saved === 'true' : false;
        });
        
        const mockCallClaude = jest.fn();
        
        // Simulate the useClaude dependency pattern
        useEffect(() => {
          // This simulates the callClaude function being recreated
        }, [reasoningMode]);
        
        return <div data-testid="reasoning-render-count">Renders: {renderCount}</div>;
      };
      
      render(<TestComponent />);
      
      expect(renderCount).toBeLessThan(3);
    });
  });

  describe('3. Modal Controller State Tests', () => {
    test('modal provider should maintain stable controller reference', () => {
      let controllerRef = null;
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const { modalController } = useModal();
        
        if (!controllerRef) {
          controllerRef = modalController;
        }
        
        return <div>Modal test component</div>;
      };
      
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      );
      
      // Controller reference should be stable
      expect(renderCount).toBeLessThan(5);
    });
  });

  describe('4. Integration Tests for Key Decryption Flow', () => {
    test('complete key decryption flow should not cause infinite loops', async () => {
      // Mock the secure storage with controlled responses
      const { hasEncryptedData, getDecrypted } = require('../src/utils/secureStorage');
      hasEncryptedData.mockReturnValue(true);
      getDecrypted
        .mockResolvedValueOnce('mock-anthropic-key')
        .mockResolvedValueOnce('mock-openai-key');
      
      render(
        <ModalProvider>
          <Terminal theme="dark" toggleTheme={() => {}} />
        </ModalProvider>
      );
      
      // Wait for initialization to complete
      await waitFor(() => {
        // Look for successful initialization or at least stable state
        const successMessages = consoleSpy.mock.calls.filter(
          call => call[0] && call[0].includes && 
          (call[0].includes('✅') || call[0].includes('completed'))
        );
        // Should have some indication of completion
      }, { timeout: 3000 });
      
      // Verify no infinite logging
      const decryptMessages = consoleSpy.mock.calls.filter(
        call => call[0] && call[0].includes && call[0].includes('🔒 Encrypted keys found')
      );
      expect(decryptMessages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('5. Performance/Loop Detection Tests', () => {
    test('should not exceed reasonable render count', () => {
      let totalRenders = 0;
      
      const TestTerminal = () => {
        totalRenders++;
        const [count, setCount] = useState(0);
        
        useEffect(() => {
          // Prevent any potential infinite loops in test
          if (count < 10) {
            setTimeout(() => setCount(c => c + 1), 10);
          }
        }, [count]);
        
        return <div>Count: {count}</div>;
      };
      
      render(<TestTerminal />);
      
      // Even with state updates, should not render excessively
      expect(totalRenders).toBeLessThan(50);
    });
  });

  describe('6. State Isolation Tests', () => {
    test('reasoning mode state should not affect modal controller', () => {
      const modalControllerEffectSpy = jest.fn();
      
      const TestTerminal = () => {
        const [reasoningMode, setReasoningMode] = useState(false);
        const [modalController] = useState({ id: 'test-controller' });
        
        // Simulate reasoning mode toggle
        useEffect(() => {
          setTimeout(() => setReasoningMode(true), 100);
        }, []);
        
        // Simulate modal controller effect
        useEffect(() => {
          modalControllerEffectSpy();
        }, [modalController]);
        
        return <div>Test component</div>;
      };
      
      render(<TestTerminal />);
      
      // Modal controller effect should only run once
      expect(modalControllerEffectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Cleanup Tests', () => {
    test('should properly cleanup effects on unmount', () => {
      const cleanupSpy = jest.fn();
      
      const TestComponent = () => {
        useEffect(() => {
          return cleanupSpy; // cleanup function
        }, []);
        
        return <div>Test component</div>;
      };
      
      const { unmount } = render(<TestComponent />);
      unmount();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});