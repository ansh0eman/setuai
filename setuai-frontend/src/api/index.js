import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
console.log('API Base URL:', baseURL);

const api = axios.create({ 
  baseURL: baseURL + "/api",
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  console.log('Request headers:', config.headers);
  console.log('Authorization header:', config.headers.Authorization);
  console.log('Full request config:', config);
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Token management
export const setAuthToken = (token) => {
  console.log('setAuthToken called with:', token ? 'token exists' : 'no token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token set in headers:', api.defaults.headers.common['Authorization']);
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed from headers');
  }
};

// Initialize token from localStorage
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// API endpoints
export const loginUser = (credentials) => {
  console.log('API: Sending login request');
  return api.post("/auth/login", credentials);
};

export const registerUser = (data) => {
  console.log('API: Sending register request');
  return api.post("/auth/register", data);
};

export const getComplianceChecklist = () => {
  console.log('API: Fetching compliance checklist');
  return api.get("/compliance/checklist");
};

export const getVendorProfile = () => {
  console.log('API: Fetching vendor profile');
  return api.get("/vendor/profile");
};

export const getVendorDocuments = () => {
  console.log('API: Fetching vendor documents');
  return api.get("/document/vendor-documents");
};

export const uploadDocument = (formData) => {
  console.log('API: Uploading document');
  return api.post("/document/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getVendorReport = () => {
  console.log('API: Fetching vendor report');
  return api.get("/vendor/report");
};

// Export the api instance for debugging
export { api };
