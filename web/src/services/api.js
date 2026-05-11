const API_BASE_URL = 'https://university-housing-system-production-64e5.up.railway.app';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

const apiRequest = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    // console.log('API Request:', { API_BASE_URL, endpoint, method, body });
    // console.log('Request Headers:', headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      // console.error('API Error Response:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   data: data,
      //   endpoint: endpoint
      // });
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      endpoint: endpoint,
      method: method
    });
    throw error;
  }
};

export const api = {
  get: (endpoint, headers) => apiRequest(endpoint, 'GET', null, headers),
  post: (endpoint, body, headers) => apiRequest(endpoint, 'POST', body, headers),
  patch: (endpoint, body, headers) => apiRequest(endpoint, 'PATCH', body, headers),
  put: (endpoint, body, headers) => apiRequest(endpoint, 'PUT', body, headers),
  delete: (endpoint, headers) => apiRequest(endpoint, 'DELETE', null, headers),
};

// Multipart form data request (for file uploads)
export const apiMultipart = async (endpoint, method = 'POST', formData, customHeaders = {}) => {
  const headers = {
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for multipart, browser will set it with boundary
  const config = {
    method,
    headers,
    body: formData,
  };

  try {
    // console.log('API Multipart Request:', { API_BASE_URL, endpoint, method });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Multipart Error:', error);
    throw error;
  }
};

export { getAuthToken, setAuthToken, removeAuthToken, API_BASE_URL };
