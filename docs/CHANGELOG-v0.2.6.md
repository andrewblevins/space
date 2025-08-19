# SPACE Terminal v0.2.6 Changelog

## Major Features

### Mobile Responsive Design
- **Complete mobile layout system** with MobileHeader, MobileLayout, MobileTabBar components
- **Touch-optimized input** with TouchInput component for virtual keyboard handling
- **Responsive container** that switches between mobile and desktop layouts at 1024px breakpoint
- **Touch scrolling isolation** - chat messages scroll independently of viewport
- **Mobile-first CSS** with touch-action properties and webkit-overflow-scrolling

### Enhanced OpenRouter Integration
- **Dynamic model fetching** from OpenRouter API (https://openrouter.ai/api/v1/models)
- **200+ AI models** from Anthropic, OpenAI, Google, Meta, Mistral, Cohere, and more
- **Environment-based behavior** - full model selection in dev, hardcoded Claude Sonnet 4 in production
- **Simplified UI** - single model dropdown in General tab (removed AI Provider tab)
- **Live model updates** with refresh functionality and loading states

### Production Optimization
- **Hardcoded Claude Sonnet 4** for production consistency and performance
- **Cost control** - production users get optimized model selection
- **Simplified UX** - no confusing provider choices for end users
- **Developer flexibility** - full model access during development

## Technical Enhancements

### Mobile Architecture
- **Responsive breakpoint system** using window.innerWidth detection
- **Touch event handling** with proper touch-action CSS properties
- **Height constraint fixes** using min-h-0 and flex-shrink-0 for proper scrolling
- **Safe area support** for devices with notches using env(safe-area-inset-*)
- **Mobile-friendly focus styles** and input sizing to prevent zoom

### OpenRouter Backend
- **New backend function** functions/api/chat/openrouter.js for authenticated requests
- **Enhanced useOpenRouter hook** with full streaming support and error handling
- **API configuration updates** supporting multiple providers
- **Usage tracking enhancements** for OpenRouter cost monitoring
- **Fallback handling** with graceful degradation if API fails

### State Management
- **Environment-aware defaults** - different behavior for dev vs production
- **Model persistence** in localStorage with production overrides
- **Loading states** for better UX during API calls
- **Error boundaries** with informative fallback content

### Build & Deployment
- **Production build optimization** with conditional code paths
- **Environment variable handling** for DEV vs production modes
- **Dynamic imports** for better code splitting
- **Asset optimization** with proper chunking

## Bug Fixes
- **Touch scrolling isolation** - prevents whole page scrolling on mobile
- **Input area positioning** - stays fixed at bottom on mobile
- **Model selection persistence** - properly saves and loads selected models
- **API key validation** - improved error messages and handling

## UI/UX Improvements
- **Cleaner Settings interface** - removed confusing AI Provider tab
- **Mobile-optimized layouts** - proper spacing and touch targets
- **Loading indicators** - shows "Loading models..." during API calls
- **Refresh functionality** - manual model list refresh button
- **Production info display** - clear indication of active model in production
- **Touch-friendly scrollbars** - optimized for mobile interaction
- **Responsive typography** - proper scaling across device sizes
- **Dark mode support** - consistent theming across mobile and desktop

---

**Total Changes:** 3 major features • 12 technical enhancements • 4 bug fixes • 8 UI improvements

Version 0.2.6 introduces comprehensive mobile responsive design and enhanced OpenRouter integration, providing users with access to 200+ AI models while maintaining optimal performance and user experience across all devices.
