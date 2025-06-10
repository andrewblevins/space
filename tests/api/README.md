# SPACE API Testing Framework

A comprehensive testing suite for the SPACE Terminal enhanced tagging system and dossier functionality.

## Overview

This testing framework validates the core API functionality of SPACE's enhanced tagging system, including:

- **Tag Analysis**: Structured tagging with categories (person, place, organization, topic, activity, state, other)
- **Memory System**: Session management, message storage, and retrieval
- **Dossier Compilation**: Cross-session search and knowledge aggregation
- **Integration**: End-to-end workflow testing

## Quick Start

```bash
# Install dependencies (if needed)
npm install

# Set environment variables
export VITE_OPENAI_API_KEY="sk-..."
export VITE_ANTHROPIC_API_KEY="sk-ant-..."

# Run all tests
node tests/api/run-tests.js

# Run individual test suites
node -e "import('./tests/api/tag-analyzer.test.js')"
node -e "import('./tests/api/memory-system.test.js')"
node -e "import('./tests/api/integration.test.js')"
```

## Test Structure

### Core Test Files

- **`setup.js`** - Test environment configuration and utilities
- **`tag-analyzer.test.js`** - Tag analysis and categorization tests
- **`memory-system.test.js`** - Session management and dossier compilation tests
- **`integration.test.js`** - End-to-end workflow tests
- **`run-tests.js`** - Test runner with reporting

### Test Categories

#### Unit Tests
- Tag structure validation
- Message format verification
- Category assignment logic
- Error handling

#### Integration Tests
- Full tagging workflow
- Cross-session dossier compilation
- Performance with large datasets
- Data migration scenarios

#### API Tests
- OpenAI integration (when API keys available)
- Storage layer interactions
- Command processing (`/dossier`)

## Test Data

The framework includes realistic test data:

```javascript
// Sample conversation with structured tags
{
  type: 'user',
  content: 'Working with Sarah Johnson from Apple on React project in San Francisco',
  tags: [
    { value: 'sarah johnson', category: 'person' },
    { value: 'apple', category: 'organization' },
    { value: 'react', category: 'topic' },
    { value: 'san francisco', category: 'place' }
  ]
}
```

## Configuration

### Environment Variables

- `VITE_OPENAI_API_KEY` - For tag analysis integration tests
- `VITE_ANTHROPIC_API_KEY` - For Claude integration tests
- `NODE_ENV=test` - Enables mock mode for unit tests

### Test Settings

```javascript
const TEST_CONFIG = {
  testTimeout: 30000,     // 30 second timeout
  mockMode: false,        // Use real APIs when available
  maxSessions: 100,       // Performance test limits
  maxMessagesPerSession: 50
};
```

## Features Tested

### Enhanced Tagging System

✅ **Tag Structure Validation**
- Required fields (value, category)
- Valid categories enforcement
- Data type validation

✅ **Category Classification**
- Person identification
- Organization detection
- Location mapping
- Topic extraction
- Activity recognition

✅ **Tag Analysis Pipeline**
- OpenAI integration
- JSON response parsing
- Error handling
- Rate limiting

### Memory System

✅ **Session Management**
- localStorage integration
- Session creation/retrieval
- Timestamp sorting
- Data persistence

✅ **Dossier Compilation**
- Cross-session search
- Tag-based filtering
- Content matching
- Chronological ordering

✅ **Query Processing**
- Natural language queries
- Partial matching
- Relevance scoring
- Result ranking

### Command Interface

✅ **Dossier Command**
- `/dossier <subject>` parsing
- Subject normalization
- Result formatting
- Error messages

✅ **Command Validation**
- Parameter checking
- Usage help
- Error recovery

## Testing Scenarios

### Real-World Workflows

1. **Project Management**
   ```
   User: "Working with John from Microsoft on Q2 budget"
   Tags: [john:person, microsoft:organization, q2 budget:topic]
   Dossier: All John + Microsoft related conversations
   ```

2. **Client Relationships**
   ```
   User: "Meeting with Apple team in San Francisco next week"
   Tags: [apple:organization, san francisco:place, meeting:activity]
   Dossier: Complete Apple interaction history
   ```

3. **Technology Discussions**
   ```
   User: "Implementing React with TypeScript for mobile app"
   Tags: [react:topic, typescript:topic, mobile app:topic]
   Dossier: All React/TypeScript development conversations
   ```

### Edge Cases

- Empty queries
- Malformed JSON responses
- Missing API keys
- Corrupted localStorage data
- Performance with large datasets
- Unicode and special characters

## Performance Benchmarks

The test suite includes performance validation:

- **Tag Analysis**: < 5 seconds per message
- **Dossier Compilation**: < 1 second for 1000 messages
- **Session Retrieval**: < 100ms for 50 sessions
- **Storage Operations**: < 50ms per session

## Error Handling

Comprehensive error scenarios:

- Network timeouts
- Invalid API responses
- Storage quota exceeded
- Malformed tag data
- Missing dependencies

## Usage Examples

### Running Specific Tests

```bash
# Tag analysis only
node tests/api/run-tests.js --suite=tag-analyzer

# Memory system only
node tests/api/run-tests.js --suite=memory

# Integration tests only
node tests/api/run-tests.js --suite=integration

# Performance tests
node tests/api/run-tests.js --performance

# Mock mode (no API calls)
NODE_ENV=test node tests/api/run-tests.js
```

### Adding New Tests

```javascript
// In any test file
describe('New Feature', () => {
  test('should handle new functionality', () => {
    const result = newFeature('test input');
    expect(result).toBe('expected output');
  });
});
```

### Custom Assertions

```javascript
// Validate tag structure
TestAssertions.assertValidTag(tag);

// Validate message format
TestAssertions.assertValidMessage(message);

// Check array contents
TestAssertions.assertContains(array, item);
```

## Best Practices

1. **Test Isolation**: Each test cleans up after itself
2. **Realistic Data**: Use representative conversation examples
3. **Error Coverage**: Test both success and failure paths
4. **Performance**: Validate response times and memory usage
5. **Compatibility**: Test data migration scenarios

## Continuous Integration

The framework is designed for CI/CD integration:

```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    export VITE_OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
    npm run test:api
  env:
    NODE_ENV: test
```

## Future Enhancements

- [ ] Automated API key rotation
- [ ] Parallel test execution
- [ ] Visual test reporting
- [ ] Integration with Jest/Vitest
- [ ] Browser automation tests
- [ ] Load testing scenarios

---

This testing framework ensures the reliability and performance of SPACE's enhanced tagging system while providing a foundation for future API development.