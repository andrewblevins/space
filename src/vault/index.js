// VAULT: public surface for the rest of the app.
// Call sites should `import { getAdvisors, saveConversation } from '../vault';`

export {
  VaultError,
  VAULT_BASE,
  isVaultAvailable,
  health,
  listAdvisors,
  saveAdvisor as clientSaveAdvisor,
  deleteAdvisor as clientDeleteAdvisor,
  listConversations,
  loadConversation as clientLoadConversation,
  saveConversation as clientSaveConversation,
  deleteConversation as clientDeleteConversation,
  listFiles,
  readFile,
  getConfig,
  saveConfig,
} from './vaultClient.js';

export {
  prewarmVault,
  isPrewarmed,
  getPrewarmError,
  getAdvisors,
  getAdvisorGroups,
  getConversationIndex,
  getCurrentConversationId,
  getConversation,
  setAdvisors,
  saveAdvisor,
  deleteAdvisor,
  setAdvisorGroups,
  setCurrentConversationId,
  loadConversation,
  saveConversation,
  deleteConversation,
} from './vaultAdapter.js';

export {
  messagesToMarkdownSections,
  sectionsToMessages,
} from './vaultMarkdown.js';
