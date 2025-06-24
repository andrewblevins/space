import React, { useState, useEffect } from 'react';
import { useConversationStorage } from '../hooks/useConversationStorage';
import { 
  needsMigration, 
  getLocalStorageSessions, 
  migrateAllSessions,
  cleanupLocalStorageSessions,
  getMigrationStatus 
} from '../utils/migrationHelper';

const MigrationModal = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState('discover'); // discover, confirm, migrating, complete
  
  // Debug isOpen prop changes
  useEffect(() => {
    console.log('🔄 MigrationModal isOpen prop changed:', isOpen);
  }, [isOpen]);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const storage = useConversationStorage();

  useEffect(() => {
    // Check if migration is needed and get sessions
    const localSessions = getLocalStorageSessions();
    if (localSessions.length > 0) {
      setSessions(localSessions);
    } else {
      // Check if migration was already completed
      const migrationStatus = getMigrationStatus();
      if (migrationStatus.status === 'completed' || migrationStatus.status === 'skipped') {
        // Show no conversations message
        setStep('no-conversations');
      } else {
        // No conversations to migrate
        setStep('no-conversations');
      }
    }
  }, []);

  const handleStartMigration = async () => {
    setStep('migrating');
    setError(null);
    
    try {
      const migrationResults = await migrateAllSessions(storage, (progressInfo) => {
        setProgress(progressInfo);
      });
      
      setResults(migrationResults);
      setStep('complete');
      
      // Clean up localStorage if migration was successful
      if (migrationResults.successful > 0) {
        cleanupLocalStorageSessions();
      }
      
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err.message);
      setStep('confirm'); // Go back to allow retry
    }
  };

  const handleSkipMigration = () => {
    // Mark migration as completed to prevent showing again
    localStorage.setItem('space_migration_status', 'skipped');
    localStorage.setItem('space_migration_date', new Date().toISOString());
    onComplete();
  };

  const handleComplete = () => {
    console.log('🔄 Migration modal handleComplete called');
    console.log('🔄 onComplete function:', onComplete);
    console.log('🔄 Current step:', step);
    try {
      onComplete();
      console.log('🔄 onComplete executed successfully');
    } catch (error) {
      console.error('🔄 Error in onComplete:', error);
    }
  };

  if (step === 'discover') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            Welcome to SPACE Terminal 0.2.4!
          </h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              We found <span className="text-green-400 font-medium">{sessions.length}</span> conversation{sessions.length !== 1 ? 's' : ''} stored in your browser.
            </p>
            
            <p>
              Move them to your account so they sync across devices and never get lost?
            </p>
            
            {sessions.length > 0 && (
              <div className="bg-gray-800 p-3 rounded text-sm">
                <div className="text-gray-400 mb-2">Sessions found:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sessions.slice(0, 5).map(session => (
                    <div key={session.id} className="flex justify-between">
                      <span className="truncate mr-2">
                        {session.title || `Session ${session.id}`}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {session.messages?.length || 0} msgs
                      </span>
                    </div>
                  ))}
                  {sessions.length > 5 && (
                    <div className="text-gray-500 text-xs">
                      ...and {sessions.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSkipMigration}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-4 py-2 bg-green-500 text-black rounded font-medium hover:bg-green-400 transition-colors"
            >
              Migrate
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            Ready to Migrate
          </h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              This will copy your {sessions.length} conversation{sessions.length !== 1 ? 's' : ''} to 
              your SPACE account. Your browser data will remain unchanged until the migration completes successfully.
            </p>
            
            {error && (
              <div className="bg-red-900 border border-red-500 text-red-400 p-3 rounded text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-blue-900 border border-blue-500 text-blue-400 p-3 rounded text-sm">
              <div className="font-medium mb-1">What happens:</div>
              <ul className="space-y-1 text-xs">
                <li>• Conversations will sync across all your devices</li>
                <li>• All messages and metadata will be preserved</li>
                <li>• You'll never lose conversations again</li>
                <li>• Original browser data stays safe during migration</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSkipMigration}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleStartMigration}
              disabled={storage.loading}
              className="flex-1 px-4 py-2 bg-green-500 text-black rounded font-medium hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {storage.loading ? 'Starting...' : 'Start Migration'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'migrating') {
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            Migrating Conversations...
          </h2>
          
          <div className="space-y-4">
            <div className="text-gray-300 text-center">
              {progress.current} of {progress.total} conversations
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <div className="text-gray-400 text-sm text-center">
              Please don't close this window...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center">
            <span className="mr-2">🎉</span>
            Migration Complete!
          </h2>
          
          <div className="space-y-4 text-gray-300">
            {results && (
              <div className="bg-gray-800 p-4 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-green-400 font-medium">{results.successful}</div>
                    <div className="text-gray-400">Successful</div>
                  </div>
                  {results.failed > 0 && (
                    <div>
                      <div className="text-red-400 font-medium">{results.failed}</div>
                      <div className="text-gray-400">Failed</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p>
              Your conversations are now synced to your account and will be available 
              on all your devices.
            </p>
            
            <div className="bg-green-900 border border-green-500 text-green-400 p-3 rounded text-sm">
              Your browser data has been safely cleaned up. Welcome to SPACE 0.2.4!
            </div>
          </div>

          <button
            onClick={() => {
              console.log('🔄 Continue to SPACE button clicked!');
              handleComplete();
            }}
            className="w-full mt-6 px-4 py-2 bg-green-500 text-black rounded font-medium hover:bg-green-400 transition-colors"
          >
            Continue to SPACE
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    console.log('🔄 MigrationModal returning null (isOpen=false)');
    return null;
  }
  
  console.log('🔄 MigrationModal rendering (isOpen=true, step=' + step + ')');

  if (step === 'no-conversations') {
    const migrationStatus = getMigrationStatus();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            No Conversations to Migrate
          </h2>
          
          <div className="space-y-4 text-gray-300">
            {migrationStatus.status === 'completed' && migrationStatus.summary ? (
              <>
                <p>
                  All your localStorage conversations have already been migrated to your account.
                </p>
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <div className="text-gray-400">Previous migration:</div>
                  <div className="mt-1">
                    • {migrationStatus.summary.successful} conversations migrated
                    {migrationStatus.summary.failed > 0 && (
                      <div className="text-red-400">
                        • {migrationStatus.summary.failed} failed
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(migrationStatus.date).toLocaleDateString()}
                  </div>
                </div>
              </>
            ) : (
              <p>
                No localStorage conversations found. Your conversations are already 
                synced to your account and available across all devices.
              </p>
            )}
          </div>

          <button
            onClick={onComplete}
            className="w-full mt-6 px-4 py-2 bg-green-500 text-black rounded font-medium hover:bg-green-400 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default MigrationModal;