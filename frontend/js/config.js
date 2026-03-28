// frontend/js/config.js
// Sehat Setu Frontend Configuration

const CONFIG = {
  // Auto-detect: use current origin in production, localhost in dev
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001/api'
    : window.location.origin + '/api',
  
  // Frontend URL - Live Server (update this to match your frontend port)
  FRONTEND_URL: 'http://127.0.0.1:5500',
  
  // Cloudinary configuration (for file uploads)
  CLOUDINARY: {
    CLOUD_NAME: 'dwitvdpbq',
    UPLOAD_PRESET: 'sehat_uploads', // Cloudinary dashboard me banao
    API_BASE: 'https://api.cloudinary.com/v1_1/dwitvdpbq'
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_AI_CHAT: true,
    ENABLE_FILE_UPLOAD: true,
    ENABLE_NOTIFICATIONS: true
  },
  
  // Development settings
  DEBUG: true,
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile'
    },
    PATIENTS: '/patients',
    DOCTORS: '/doctors',
    CHAT: '/chat',
    DOCUMENTS: '/documents',
    APPOINTMENTS: '/appointments',
    HEALTH_METRICS: '/health-metrics'
  },
  
  // LocalStorage keys
  STORAGE_KEYS: {
    TOKEN: 'sehat_token',
    USER: 'sehat_user',
    REFRESH_TOKEN: 'sehat_refresh_token'
  },
  
  // Messages
  MESSAGES: {
    LOGIN_SUCCESS: 'Successfully logged in',
    LOGIN_ERROR: 'Login failed',
    NETWORK_ERROR: 'Network connection error',
    BACKEND_OFFLINE: 'Server connection failed'
  }
};

// Helper function - Full API URL banane ke liye
function getApiUrl(endpoint) {
  return CONFIG.API_BASE_URL + endpoint;
}

// Helper function - Frontend URL banane ke liye
function getFrontendUrl(path = '') {
  return CONFIG.FRONTEND_URL + '/frontend' + path;
}

// Helper function - Show toast notifications
function showToast(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Yahan aap actual toast notification add kar sakte hai
}

// Development me configuration log karo
if (CONFIG.DEBUG) {
  console.log('🔧 Sehat Setu Configuration Loaded');
  console.log('📡 Backend API:', CONFIG.API_BASE_URL);
  console.log('🌐 Frontend URL:', CONFIG.FRONTEND_URL);
}