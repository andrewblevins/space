import { removeEncrypted } from './secureStorage';

export const handleApiError = async (response) => {
  if (response.status === 401) {
    // Clear stored API keys
    removeEncrypted('space_anthropic_key');
    removeEncrypted('space_openai_key');
    
    // Store error message for next page load
    sessionStorage.setItem('auth_error', 'Your API key has expired or been deactivated. Please enter new API keys to continue.');
    
    // Force re-authentication
    window.location.reload();
    
    throw new Error('API key invalid or expired. Please re-enter your API keys.');
  }
  
  // Handle other errors
  const errorText = await response.text();
  throw new Error(`API Error (${response.status}): ${errorText}`);
}; 