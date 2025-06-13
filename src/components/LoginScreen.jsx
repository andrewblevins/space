import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const { signInWithGoogle, signInWithEmail, signUp } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      console.log(`Starting ${isSignUp ? 'sign up' : 'sign in'} for:`, email);
      
      if (isSignUp) {
        console.log('Calling signUp function...');
        await signUp(email, password);
        console.log('Sign up completed successfully');
        // For sign up, we might need to show a confirmation message
        setMessage('Check your email for a confirmation link to complete your registration.');
      } else {
        console.log('Calling signInWithEmail function...');
        await signInWithEmail(email, password);
        console.log('Sign in completed successfully');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full">
        {/* Clear Visual Header with Mode Indication */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-400 mb-2">
            SPACE Terminal
          </h1>
          <div className="flex justify-center mb-4">
            <div className={`px-4 py-2 rounded-l-lg border-2 transition-colors ${
              !isSignUp 
                ? 'bg-green-500 text-black border-green-500' 
                : 'bg-transparent text-green-400 border-green-500 hover:bg-green-500/10'
            }`}>
              <button 
                onClick={() => setIsSignUp(false)} 
                className="font-medium"
                disabled={loading}
              >
                Sign In
              </button>
            </div>
            <div className={`px-4 py-2 rounded-r-lg border-2 border-l-0 transition-colors ${
              isSignUp 
                ? 'bg-green-500 text-black border-green-500' 
                : 'bg-transparent text-green-400 border-green-500 hover:bg-green-500/10'
            }`}>
              <button 
                onClick={() => setIsSignUp(true)} 
                className="font-medium"
                disabled={loading}
              >
                Sign Up
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            {isSignUp 
              ? 'Create your account to start conversing with AI' 
              : 'Welcome back! Sign in to continue your conversations'
            }
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-500 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-blue-900 border border-blue-500 text-blue-400 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {/* Google Sign-in with Dynamic Text */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-black py-3 px-4 rounded mb-4 font-medium hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Please wait...' : `${isSignUp ? 'Sign up' : 'Continue'} with Google`}
        </button>

        <div className="text-center text-gray-400 mb-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative bg-gray-900 px-3">
            <span className="text-sm">or</span>
          </div>
        </div>

        {/* Email Form with Dynamic Content */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <input
            type="password"
            placeholder={isSignUp ? "Create password (8+ characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-green-500 text-green-400 p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            required
            minLength={isSignUp ? 8 : undefined}
          />
          
          {/* Sign-up specific content */}
          {isSignUp && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded text-sm text-green-300">
              <p className="font-medium mb-1">🎉 You're creating a new account!</p>
              <p>• Free daily message limit to get started</p>
              <p>• Access to Claude and GPT models</p>
              <p>• Conversation history and settings sync</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded font-medium transition-colors disabled:opacity-50 ${
              isSignUp
                ? 'bg-blue-600 text-white hover:bg-blue-500 border-2 border-blue-600'
                : 'bg-green-500 text-black hover:bg-green-400 border-2 border-green-500'
            }`}
          >
            {loading 
              ? 'Please wait...' 
              : isSignUp 
                ? '🚀 Create Account' 
                : '🔐 Sign In'
            }
          </button>
        </form>

        {/* Additional Sign-up Information */}
        {isSignUp && (
          <div className="mt-4 text-xs text-gray-400 text-center">
            By creating an account, you agree to our terms of service and privacy policy.
          </div>
        )}
      </div>
    </div>
  );
}