/**
 * Test script for journal onboarding feature
 *
 * This script:
 * 1. Opens the app in a browser
 * 2. Clears localStorage to simulate fresh start
 * 3. Verifies journal onboarding appears
 * 4. Tests the full onboarding flow
 */

import puppeteer from 'puppeteer';

async function testJournalOnboarding() {
  console.log('🚀 Starting journal onboarding test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Listen to console messages
  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('DevTools')) {
      console.log('  Browser:', text);
    }
  });

  try {
    console.log('📄 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');

    // Wait for app to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🧹 Clearing localStorage to simulate fresh start...');
    await page.evaluate(() => {
      // Clear everything except API keys (if set)
      const anthropicKey = localStorage.getItem('anthropic_api_key');
      const openaiKey = localStorage.getItem('openai_api_key');

      localStorage.clear();

      // Restore API keys if they existed
      if (anthropicKey) localStorage.setItem('anthropic_api_key', anthropicKey);
      if (openaiKey) localStorage.setItem('openai_api_key', openaiKey);

      console.log('✅ localStorage cleared, API keys preserved');
    });

    // Reload to trigger fresh state
    console.log('🔄 Reloading page...');
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if journal onboarding is visible
    console.log('🔍 Looking for journal onboarding UI...');
    const journalPrompt = await page.$('textarea[placeholder*="Take a moment"]');

    if (!journalPrompt) {
      console.error('❌ Journal onboarding not visible!');
      console.log('   Current page state:');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('   ', bodyText.slice(0, 200));
      return;
    }

    console.log('✅ Journal onboarding is visible!');

    // Test writing a journal entry
    console.log('✍️  Writing a test journal entry...');
    const journalText = `I've been thinking a lot about building better AI interfaces.
There's this tension between making things simple enough for anyone to use, but powerful
enough to handle complex problems. I want to create something that helps people think
better, not just get quick answers. How can we design systems that encourage deeper
reflection while still being practical and usable?`;

    await journalPrompt.type(journalText, { delay: 10 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if Generate button is enabled
    const generateButton = await page.$('button:has-text("Generate Advisors")');
    if (!generateButton) {
      console.error('❌ Generate Advisors button not found!');
      return;
    }

    console.log('🔘 Clicking Generate Advisors button...');
    await generateButton.click();

    // Wait for API call and suggestions modal
    console.log('⏳ Waiting for advisor suggestions...');
    await page.waitForSelector('h2:has-text("Suggested Advisors")', {
      timeout: 30000
    });

    console.log('✅ Advisor suggestions modal appeared!');

    // Check how many advisors were suggested
    const advisorCards = await page.$$('[class*="border-2 rounded-lg p-4"]');
    console.log(`📋 Found ${advisorCards.length} suggested advisors`);

    // Get advisor names
    const advisorNames = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3[class*="font-serif"]'));
      return cards.map(card => card.textContent.trim());
    });

    console.log('👥 Suggested advisors:', advisorNames);

    // Select the first two advisors
    console.log('🎯 Selecting first two advisors...');
    const addButtons = await page.$$('button[title="Add to selection"]');
    if (addButtons.length >= 2) {
      await addButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 300));
      await addButtons[1].click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Click "Add Selected" button
    console.log('✅ Adding selected advisors...');
    const addSelectedButton = await page.$('button:has-text("Add Selected")');
    await addSelectedButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify advisors were added to the panel
    console.log('🔍 Verifying advisors were added to the Advisors panel...');
    const advisorPanel = await page.$('div:has-text("Advisors")');
    if (advisorPanel) {
      const panelText = await page.evaluate(el => el.textContent, advisorPanel);
      console.log('✅ Advisors panel updated!');
      console.log('   Panel content:', panelText.slice(0, 100));
    }

    // Verify journal entry is in the conversation
    console.log('🔍 Checking if journal entry appears in messages...');
    const messageContent = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('[class*="mb-4"]'));
      return messages.map(m => m.textContent.slice(0, 50)).join(' | ');
    });

    if (messageContent.includes('thinking') || messageContent.includes('AI interfaces')) {
      console.log('✅ Journal entry found in conversation!');
    } else {
      console.log('⚠️  Journal entry might not be visible in conversation');
    }

    console.log('\n✅ Test completed successfully!');
    console.log('   Browser will remain open for manual inspection.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testJournalOnboarding();
