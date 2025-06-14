/**
 * Helper script to get auth token for testing
 * 
 * This script helps you quickly get a valid auth token
 * for testing the API endpoints.
 * 
 * Instructions:
 * 1. Run: npm run dev:functions
 * 2. Open: http://localhost:3000
 * 3. Sign in to SPACE Terminal
 * 4. Run this in browser console to get token
 */

console.log(`
🔑 Getting Auth Token for API Testing

Run this in your browser console after signing in to SPACE Terminal:

// Get token from localStorage
const authData = JSON.parse(localStorage.getItem('sb-' + window.location.hostname.replace(/\\./g, '-') + '-auth-token'));
if (authData && authData.access_token) {
  console.log('🎯 Your auth token:');
  console.log(authData.access_token);
  console.log('\\n📋 Copy this token and use it in test scripts');
} else {
  console.log('❌ No auth token found. Make sure you are signed in.');
}

// Alternative: Get from Supabase client
// if (window.supabase) {
//   window.supabase.auth.getSession().then(({data: {session}}) => {
//     if (session) {
//       console.log('🎯 Auth token:', session.access_token);
//     }
//   });
// }
`);

// For Node.js testing, this won't work, but provides instructions
if (typeof window === 'undefined') {
  console.log('📋 Instructions for getting auth token:');
  console.log('1. Start dev server: npm run dev:functions');
  console.log('2. Open browser: http://localhost:3000');
  console.log('3. Sign in to SPACE Terminal');
  console.log('4. Open browser dev tools → Console');
  console.log('5. Paste and run the code shown above');
  console.log('6. Copy the token for use in test scripts');
}