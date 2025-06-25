# Client-Side Encryption Implementation Plan

## Overview

This document outlines the implementation of client-side encryption for SPACE Terminal conversations. The goal is to encrypt conversation data before it reaches our servers, ensuring that administrators cannot access user conversation content while maintaining full functionality.

## Privacy Scope and Limitations

### What Gets Protected
- Conversation content stored on our servers
- Conversation titles and metadata
- Advisor descriptions and configurations
- Voting questions and debate records
- Protection against our database breaches or admin access

### What Remains Shared
- **All conversation content still goes to Anthropic (Claude) and OpenAI (ChatGPT) APIs in plaintext**
- AI providers can still see, process, and potentially store all messages
- This encryption protects against SPACE Terminal access, not AI provider access

### Honest Value Proposition
"Your conversations are encrypted on our servers so we cannot access them. However, messages are still processed by Claude and ChatGPT APIs for AI responses. This minimizes your data footprint while providing powerful AI capabilities."

## Technical Architecture

### Encryption Key Management
```javascript
// 1. Derive encryption key from user's Google OAuth token
const deriveUserKey = async (googleToken) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(googleToken + 'SPACE_SALT'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('SPACE_ENCRYPTION_SALT'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// 2. Store key in browser session (not localStorage for security)
let userEncryptionKey = null;
```

### Data Encryption Functions
```javascript
// Encrypt data before sending to server
const encryptData = async (plaintext, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv)
  };
};

// Decrypt data received from server
const decryptData = async (encryptedData, key) => {
  const encrypted = new Uint8Array(encryptedData.encrypted);
  const iv = new Uint8Array(encryptedData.iv);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
};
```

## Database Schema Changes

### Current Schema
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Encrypted Schema
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  encrypted_title JSONB, -- {encrypted: [...], iv: [...]}
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Non-sensitive metadata only
  -- Analytics-friendly unencrypted fields
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  type TEXT NOT NULL, -- Keep for basic functionality
  encrypted_content JSONB, -- {encrypted: [...], iv: [...]}
  created_at TIMESTAMP WITH TIME ZONE,
  -- Analytics-friendly unencrypted fields
  token_count INTEGER,
  processing_time_ms INTEGER
);
```

## Implementation Phases

### Phase 1: Basic Encryption (Week 1)
**Goal:** Encrypt new conversations without breaking existing functionality

#### Step 1: Encryption Utilities
- [ ] Create `src/utils/encryption.js` with encrypt/decrypt functions
- [ ] Add key derivation from Google OAuth token
- [ ] Add browser crypto API wrapper functions

#### Step 2: Storage Layer Updates
- [ ] Update `useConversationStorage.js` to encrypt before saving
- [ ] Modify database calls to handle encrypted data structure
- [ ] Add decryption on data retrieval

#### Step 3: Message Flow Updates
- [ ] Encrypt message content before database storage
- [ ] Keep AI API calls unencrypted (messages still go to Claude/ChatGPT in plaintext)
- [ ] Decrypt messages when loading conversations

#### Step 4: Testing
- [ ] Verify encryption/decryption round-trip works
- [ ] Test conversation loading and saving
- [ ] Ensure AI responses still work normally

### Phase 2: Migration & UI (Week 2)
**Goal:** Migrate existing conversations and add user-facing encryption indicators

#### Step 1: Data Migration
- [ ] Create migration script for existing conversations
- [ ] Add migration modal for users to consent to encryption
- [ ] Backup existing data before migration

#### Step 2: User Interface Updates
- [ ] Add encryption status indicators in conversation list
- [ ] Show "🔒 Encrypted" badges on encrypted conversations
- [ ] Add encryption explanation in settings

#### Step 3: Error Handling
- [ ] Handle encryption failures gracefully
- [ ] Add recovery options for corrupted encrypted data
- [ ] Implement fallback to unencrypted storage if encryption fails

### Phase 3: Advanced Features (Week 3)
**Goal:** Encrypt metadata and add advanced privacy features

#### Step 1: Extended Encryption
- [ ] Encrypt conversation titles
- [ ] Encrypt advisor descriptions and configurations
- [ ] Encrypt voting questions and responses

#### Step 2: Export/Import
- [ ] Add encrypted export functionality
- [ ] Allow users to download encrypted backups
- [ ] Implement import from encrypted backups

#### Step 3: Privacy Enhancements
- [ ] Add option to auto-delete old conversations
- [ ] Implement client-side search through encrypted data
- [ ] Add privacy dashboard showing what's encrypted

## Security Considerations

### Key Management
- **Derive keys from OAuth tokens** to ensure they're user-specific
- **Store keys in memory only** during session (not localStorage)
- **Regenerate keys on login** to ensure fresh encryption per session

### Browser Compatibility
- **Use Web Crypto API** (supported in all modern browsers)
- **Feature detection** and graceful fallback for unsupported browsers
- **Progressive enhancement** - app works without encryption if crypto unavailable

### Error Recovery
- **Corruption detection** - verify data integrity after decryption
- **Fallback storage** - option to store unencrypted if encryption fails
- **User notification** - clear errors if encryption/decryption fails

## Analytics Impact

### What We Can Still Track
- **User engagement** - login frequency, session duration
- **Feature usage** - messages sent, advisors created, votes cast
- **Performance metrics** - response times, error rates
- **Growth metrics** - new users, retention, usage patterns

### What We Lose
- **Content analysis** - cannot analyze conversation topics or sentiment
- **AI debugging** - cannot read conversations to debug AI issues
- **Content search** - cannot implement server-side conversation search

### Mitigation Strategies
- **Client-side analytics** - analyze content in browser, send aggregated stats only
- **Error metadata** - collect error information without conversation content
- **User surveys** - gather feedback through other channels

## Code Structure

### New Files
```
src/
  utils/
    encryption.js          # Core encryption functions
    encryptionMigration.js  # Data migration utilities
  hooks/
    useEncryption.js        # React hook for encryption state
  components/
    EncryptionStatus.jsx    # UI component showing encryption state
    MigrationModal.jsx      # Consent and migration interface
docs/
  ENCRYPTION_GUIDE.md      # User-facing encryption documentation
```

### Modified Files
```
src/
  hooks/
    useConversationStorage.js  # Add encryption layer
  components/
    Terminal.jsx               # Show encryption status
    SettingsMenu.jsx           # Add encryption settings
  utils/
    migrationHelper.js         # Handle encrypted data migration
```

## Privacy Policy Updates

### New Section: Data Encryption
```markdown
## Client-Side Encryption

SPACE Terminal encrypts your conversation data on your device before storing it on our servers. This means:

- **We cannot read your conversation content** - it's encrypted before reaching our servers
- **Your conversations are protected** from database breaches or admin access
- **AI processing remains unaffected** - messages are still sent to Claude and ChatGPT APIs for responses
- **Cross-device sync works normally** - encrypted data synchronizes across your devices

### What This Protects
- Conversation content stored on our servers
- Conversation titles and metadata
- Advisor configurations and voting data

### What This Doesn't Protect
- **AI API processing** - your messages are still processed by Anthropic and OpenAI
- **Browser storage** - conversations are decrypted in your browser for display
- **Export files** - exported data includes unencrypted content for portability

### Technical Details
- Encryption uses AES-256-GCM with keys derived from your authentication
- Keys are generated fresh each session and never stored on our servers
- Only you can decrypt your conversation data
```

## Testing Strategy

### Unit Tests
- [ ] Encryption/decryption function tests
- [ ] Key derivation tests
- [ ] Error handling tests

### Integration Tests
- [ ] End-to-end conversation flow with encryption
- [ ] Cross-device sync with encrypted data
- [ ] Migration from unencrypted to encrypted storage

### User Testing
- [ ] Performance impact assessment
- [ ] User experience with encryption indicators
- [ ] Recovery from encryption failures

## Rollout Plan

### Development Phase (Week 1)
- Implement basic encryption on development branch
- Test with sample data
- Verify no impact on AI functionality

### Beta Phase (Week 2)
- Deploy to staging environment
- Test with volunteer users
- Gather feedback on UX changes

### Production Rollout (Week 3)
- Deploy to production with feature flag
- Gradual rollout to user segments
- Monitor for issues and performance impact

### Post-Launch (Week 4+)
- Analyze user adoption rates
- Gather feedback on privacy improvements
- Plan advanced encryption features

## Success Metrics

### Technical Metrics
- **Encryption success rate** - percentage of data successfully encrypted/decrypted
- **Performance impact** - latency added by encryption operations
- **Error rates** - failures in encryption/decryption processes

### User Metrics
- **Adoption rate** - percentage of users who migrate to encrypted storage
- **User satisfaction** - feedback on privacy improvements
- **Retention impact** - whether encryption affects user retention

### Privacy Metrics
- **Data exposure reduction** - amount of plaintext data removed from servers
- **Admin access elimination** - confirmation that conversation content is inaccessible
- **Compliance improvement** - enhanced privacy policy strength

## Future Enhancements

### Advanced Privacy Features
- **Zero-knowledge architecture** - encrypt all metadata
- **Perfect forward secrecy** - rotate encryption keys regularly
- **Client-side search** - search encrypted data without server access

### User Control Features
- **Encryption preferences** - per-conversation encryption settings
- **Data retention controls** - automatic deletion of old encrypted data
- **Privacy dashboard** - comprehensive view of user's encrypted data

### Developer Features
- **Encryption metrics dashboard** - monitor encryption health
- **Privacy audit tools** - verify no plaintext data exposure
- **Compliance reporting** - automated privacy compliance checks

---

## Implementation Checklist

### Before Starting
- [ ] Review this plan with team
- [ ] Set up development environment for encryption testing
- [ ] Create backup of current database structure

### Phase 1 Completion Criteria
- [ ] All new conversations are encrypted by default
- [ ] Existing functionality works unchanged
- [ ] Performance impact is minimal (<100ms added latency)
- [ ] No plaintext conversation content in new database entries

### Phase 2 Completion Criteria
- [ ] Existing users can migrate to encrypted storage
- [ ] UI clearly indicates encryption status
- [ ] Error handling covers all failure scenarios
- [ ] User education materials are complete

### Phase 3 Completion Criteria
- [ ] All user-generated content is encrypted
- [ ] Export/import functionality works with encrypted data
- [ ] Privacy policy accurately reflects encryption implementation
- [ ] Analytics still provide useful insights without exposing content

---

*This plan prioritizes user privacy while maintaining the full functionality of SPACE Terminal. Implementation should be incremental and well-tested at each phase.*