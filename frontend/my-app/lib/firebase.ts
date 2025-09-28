import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Hardcoded configuration to bypass environment variable issues
const firebaseConfig = {
  apiKey: "AIzaSyCa2T78OkPktF4g9nOS_HZxMCWKWcNqIa0",
  authDomain: "cite-21139.firebaseapp.com",
  projectId: "cite-21139",
  storageBucket: "cite-21139.firebasestorage.app",
  messagingSenderId: "657351947813",
  appId: "1:657351947813:web:419455d08a5e025bf2b1cc"
}

// Initialize Firebase
let app: any = null
let auth: any = null
let googleProvider: any = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  console.log('Firebase initialized successfully')
} catch (error) {
  console.error('Firebase initialization error:', error)
  console.warn('Firebase configuration issue. Please check:')
  console.warn('1. Google Authentication is enabled in Firebase Console')
  console.warn('2. localhost is in authorized domains')
  console.warn('3. API key has no restrictions in Google Cloud Console')
}

export { auth, googleProvider }
export default app
