#!/usr/bin/env node

/**
 * Streaming Performance Test
 * 
 * This script tests the streaming performance degradation issue by simulating
 * conversations of varying lengths and measuring rendering performance.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testStreamingPerformance() {
  console.log('🚀 Starting streaming performance analysis...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    
    // Set up console logging
    page.on('console', (msg) => {
      if (msg.text().includes('Performance:') || msg.text().includes('🔥')) {
        console.log(`BROWSER: ${msg.text()}`);
      }
    });

    // Navigate to local development server
    console.log('📱 Navigating to SPACE Terminal...');
    await page.goto('http://localhost:8788', { waitUntil: 'networkidle2' });

    // Wait for app to load
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
    
    console.log('✅ App loaded, starting performance tests...');

    // Test scenarios with different conversation lengths
    const testScenarios = [
      { messages: 2, description: 'Short conversation (2 messages)' },
      { messages: 10, description: 'Medium conversation (10 messages)' },
      { messages: 25, description: 'Long conversation (25 messages)' },
      { messages: 50, description: 'Very long conversation (50 messages)' }
    ];

    const results = [];

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing: ${scenario.description}`);
      
      // Clear conversation
      await page.evaluate(() => {
        localStorage.clear();
        window.location.reload();
      });
      
      await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 5000 });
      
      // Build up conversation to target length
      for (let i = 0; i < scenario.messages - 1; i++) {
        const input = `Test message ${i + 1}`;
        await page.type('[data-testid="terminal-input"]', input);
        await page.keyboard.press('Enter');
        
        // Wait for response to complete
        await page.waitForFunction(
          () => !document.querySelector('.text-amber-600'),
          { timeout: 10000 }
        );
        
        // Small delay between messages
        await page.waitForTimeout(500);
      }

      console.log(`📊 Conversation built to ${scenario.messages - 1} messages, testing streaming...`);

      // Inject performance monitoring code
      await page.evaluate(() => {
        window.streamingPerf = {
          startTime: null,
          updateCount: 0,
          renderTimes: []
        };

        // Hook into React DevTools or observe DOM mutations
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              const target = mutation.target;
              if (target.closest && target.closest('[id^="msg-"]')) {
                window.streamingPerf.updateCount++;
                const now = performance.now();
                if (window.streamingPerf.startTime) {
                  window.streamingPerf.renderTimes.push(now - window.streamingPerf.startTime);
                }
                window.streamingPerf.startTime = now;
              }
            }
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });

        console.log('🔥 Performance monitoring injected');
      });

      // Start timed streaming test
      const testMessage = 'Please provide a detailed explanation about the importance of performance optimization in React applications, including specific techniques like memoization, virtual DOM reconciliation, and component lifecycle management.';
      
      const startTime = Date.now();
      
      await page.type('[data-testid="terminal-input"]', testMessage);
      
      // Start performance measurement
      await page.evaluate(() => {
        window.streamingPerf.testStart = performance.now();
        window.streamingPerf.updateCount = 0;
        window.streamingPerf.renderTimes = [];
      });
      
      await page.keyboard.press('Enter');

      // Monitor streaming completion
      let streamingComplete = false;
      let measurements = [];
      
      while (!streamingComplete) {
        await page.waitForTimeout(200);
        
        const currentState = await page.evaluate(() => ({
          isLoading: !!document.querySelector('.text-amber-600'),
          updateCount: window.streamingPerf.updateCount,
          averageRenderTime: window.streamingPerf.renderTimes.length > 0 
            ? window.streamingPerf.renderTimes.reduce((a, b) => a + b, 0) / window.streamingPerf.renderTimes.length
            : 0,
          lastRenderTime: window.streamingPerf.renderTimes[window.streamingPerf.renderTimes.length - 1] || 0
        }));

        measurements.push({
          timestamp: Date.now() - startTime,
          ...currentState
        });

        if (!currentState.isLoading && currentState.updateCount > 0) {
          streamingComplete = true;
        }

        // Timeout after 30 seconds
        if (Date.now() - startTime > 30000) {
          console.log('⚠️ Test timed out');
          break;
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const finalMetrics = await page.evaluate(() => ({
        totalUpdates: window.streamingPerf.updateCount,
        averageRenderTime: window.streamingPerf.renderTimes.length > 0 
          ? window.streamingPerf.renderTimes.reduce((a, b) => a + b, 0) / window.streamingPerf.renderTimes.length
          : 0,
        maxRenderTime: Math.max(...window.streamingPerf.renderTimes),
        minRenderTime: Math.min(...window.streamingPerf.renderTimes),
        renderTimeVariance: window.streamingPerf.renderTimes.length > 1
          ? window.streamingPerf.renderTimes.reduce((acc, time, _, arr) => {
              const mean = arr.reduce((a, b) => a + b) / arr.length;
              return acc + Math.pow(time - mean, 2);
            }, 0) / (window.streamingPerf.renderTimes.length - 1)
          : 0
      }));

      const result = {
        scenario: scenario.description,
        messageCount: scenario.messages,
        totalStreamingTime: totalTime,
        ...finalMetrics,
        measurements
      };

      results.push(result);

      console.log(`✅ Completed: ${scenario.description}`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Updates: ${finalMetrics.totalUpdates}`);
      console.log(`   Avg render time: ${finalMetrics.averageRenderTime.toFixed(2)}ms`);
      console.log(`   Max render time: ${finalMetrics.maxRenderTime.toFixed(2)}ms`);

      await page.waitForTimeout(1000);
    }

    // Generate report
    console.log('\n📊 STREAMING PERFORMANCE ANALYSIS COMPLETE');
    console.log('=' .repeat(60));

    const report = {
      timestamp: new Date().toISOString(),
      testConditions: {
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: await page.viewport(),
        url: page.url()
      },
      results,
      analysis: analyzeResults(results)
    };

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'performance-reports', `streaming-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    // Print summary
    printSummary(results);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

function analyzeResults(results) {
  const analysis = {
    performanceDegradation: false,
    correlations: {},
    recommendations: []
  };

  // Check for performance degradation pattern
  const renderTimes = results.map(r => r.averageRenderTime);
  const messageCounts = results.map(r => r.messageCount);

  // Simple correlation coefficient calculation
  const correlation = calculateCorrelation(messageCounts, renderTimes);
  analysis.correlations.messageCountVsRenderTime = correlation;

  if (correlation > 0.5) {
    analysis.performanceDegradation = true;
    analysis.recommendations.push(
      'Strong positive correlation between message count and render time detected.',
      'Consider implementing React.memo optimization for message components.',
      'Implement virtualization for long conversations.',
      'Optimize React keys to prevent unnecessary re-renders.'
    );
  }

  // Check for variance increase
  const variances = results.map(r => r.renderTimeVariance);
  if (variances[variances.length - 1] > variances[0] * 2) {
    analysis.recommendations.push(
      'Render time variance increases significantly with conversation length.',
      'This suggests layout thrashing or DOM manipulation bottlenecks.'
    );
  }

  return analysis;
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function printSummary(results) {
  console.log('\n📈 PERFORMANCE SUMMARY:');
  console.log('-'.repeat(50));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.scenario}`);
    console.log(`   Messages: ${result.messageCount}`);
    console.log(`   Total time: ${result.totalStreamingTime}ms`);
    console.log(`   Avg render: ${result.averageRenderTime.toFixed(2)}ms`);
    console.log(`   Max render: ${result.maxRenderTime.toFixed(2)}ms`);
    console.log(`   Updates: ${result.totalUpdates}`);
    console.log('');
  });

  // Performance degradation check
  const firstAvg = results[0].averageRenderTime;
  const lastAvg = results[results.length - 1].averageRenderTime;
  const degradation = ((lastAvg - firstAvg) / firstAvg * 100);

  console.log(`🔍 Performance Analysis:`);
  console.log(`   First test avg: ${firstAvg.toFixed(2)}ms`);
  console.log(`   Last test avg: ${lastAvg.toFixed(2)}ms`);
  console.log(`   Degradation: ${degradation.toFixed(1)}%`);

  if (degradation > 50) {
    console.log('❌ SIGNIFICANT PERFORMANCE DEGRADATION DETECTED');
  } else if (degradation > 20) {
    console.log('⚠️ Moderate performance degradation detected');
  } else {
    console.log('✅ Performance remains relatively stable');
  }
}

// Run the test
if (require.main === module) {
  testStreamingPerformance().catch(console.error);
}

module.exports = { testStreamingPerformance };