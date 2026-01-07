import React from 'react';

const PrivacyPolicy = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-term-600 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-700">
          <h2 className="text-term-400 text-2xl font-semibold">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-term-400 transition-colors"
            title="Close Privacy Policy"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 text-gray-300 space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="leading-relaxed">
              SPACE Terminal is committed to protecting your privacy. This policy explains how we collect, 
              use, and protect your information when you use our AI conversation platform.
            </p>
          </div>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Information We Collect</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">Account Information</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Email address (from Google OAuth authentication)</li>
                  <li>Authentication tokens and session data</li>
                  <li>Account creation and last access timestamps</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Conversation Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Complete conversation history including all messages</li>
                  <li>AI advisor configurations and descriptions</li>
                  <li>Voting history and debate records</li>
                  <li>Session metadata (tags, timestamps, usage patterns)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Usage Analytics</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Page views and user session data (via Google Analytics)</li>
                  <li>Feature usage patterns (login, messages sent, advisors created)</li>
                  <li>Device and browser information</li>
                  <li>Geographic location (country/region level)</li>
                  <li>Rate limiting and usage statistics</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Provide and improve the AI conversation experience</li>
              <li>Maintain conversation history and sync across devices</li>
              <li>Enforce usage limits and prevent abuse</li>
              <li>Analyze usage patterns to improve features</li>
              <li>Ensure system security and performance</li>
              <li>Communicate important service updates</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Data Storage and Access</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">Database Storage</h4>
                <p className="text-sm">
                  Your conversations are stored in plaintext in a secure Supabase (PostgreSQL) database 
                  with row-level security policies that restrict access to your own data. Conversations 
                  are not encrypted on the server. Database servers are located in the United States.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Administrative Access</h4>
                <p className="text-sm">
                  Application administrators have technical access to user data through database 
                  administration tools for troubleshooting, security, and service improvement purposes. 
                  This includes the ability to read conversation content in plaintext. This access is 
                  logged and restricted to essential personnel.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Third-Party Services</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">Google Analytics</h4>
                <p className="text-sm">
                  We use Google Analytics to understand how users interact with SPACE Terminal. 
                  Google Analytics collects anonymous usage data and may use cookies. You can 
                  opt-out using browser settings or ad blockers. No conversation content is 
                  sent to Google Analytics.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Google OAuth</h4>
                <p className="text-sm">
                  We use Google OAuth for secure authentication. We only access your email 
                  address for account identification. We do not access other Google services 
                  or data.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">AI Service Providers</h4>
                <p className="text-sm">
                  Your messages are sent to Anthropic (Claude) and OpenAI (GPT) APIs to generate 
                  AI responses. These services may temporarily process your messages according 
                  to their respective privacy policies. We use server-side API calls to protect 
                  your API credentials.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Your Rights and Controls</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Data Export:</strong> Export your conversations in JSON or Markdown format</li>
              <li><strong>Account Deletion:</strong> Request complete account and data deletion</li>
              <li><strong>Data Correction:</strong> Request corrections to your account information</li>
              <li><strong>Analytics Opt-out:</strong> Use browser settings or ad blockers to disable tracking</li>
              <li><strong>Conversation Management:</strong> Delete individual conversations or sessions</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Data Security</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>All data transmitted using HTTPS encryption</li>
              <li>Database access protected by authentication and row-level security</li>
              <li>API keys and sensitive data encrypted in storage</li>
              <li>Regular security audits and monitoring</li>
              <li>Access logging for administrative actions</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Data Retention</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Conversations stored indefinitely unless you request deletion</li>
              <li>Analytics data aggregated and stored for product improvement</li>
              <li>Account deletion removes all associated conversations and data</li>
              <li>Backup data purged within 30 days of deletion request</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Children's Privacy</h3>
            <p className="text-sm">
              SPACE Terminal is not intended for use by children under 13. We do not knowingly 
              collect personal information from children under 13. If we become aware that we 
              have collected such information, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Changes to This Policy</h3>
            <p className="text-sm">
              We may update this privacy policy from time to time. We will notify users of 
              significant changes by posting the new policy on our website and updating the 
              "last updated" date. Continued use of SPACE Terminal after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-term-400 mb-3">Contact Us</h3>
            <p className="text-sm">
              If you have questions about this privacy policy or your data, please contact us at:
            </p>
            <div className="mt-2 text-sm">
              <p>Email: <a href="mailto:privacy@spaceterminal.xyz" className="text-term-400 hover:text-term-300">privacy@spaceterminal.xyz</a></p>
              <p>Website: <a href="https://spaceterminal.xyz" className="text-term-400 hover:text-term-300">https://spaceterminal.xyz</a></p>
            </div>
          </section>
        </div>

        <div className="p-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-term-500 text-black rounded font-medium hover:bg-term-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;