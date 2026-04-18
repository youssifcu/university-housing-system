export const API_BASE_URL = 'https://university-housing-system-production-64e5.up.railway.app';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    ALL: '/api/users',
    BY_ID: (id) => `/api/users/${id}`,
  },
  BUILDINGS: {
    ALL: '/api/buildings',
    BY_ID: (id) => `/api/buildings/${id}`,
  },
  ROOMS: {
    ALL: '/api/rooms',
    BY_ID: (id) => `/api/rooms/${id}`,
    ASSIGN: (id) => `/api/rooms/${id}/assign`,
    REMOVE_STUDENT: (id) => `/api/rooms/${id}/remove-student`,
  },
  APPLICATIONS: {
    ALL: '/api/applications',
    MY_APPLICATIONS: '/api/applications/my-applications',
    BY_ID: (id) => `/api/applications/${id}`,
    UPDATE_STATUS: (id) => `/api/applications/${id}/status`,
  },
  ROOM_CHANGES: {
    ALL: '/api/room-change-requests',
    MY_REQUESTS: '/api/room-change-requests/my-requests',
    UPDATE_STATUS: (id) => `/api/room-change-requests/${id}/status`,
  },
  MEALS: {
    ALL: '/api/meals',
    BY_ID: (id) => `/api/meals/${id}`,
  },
};
