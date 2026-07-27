import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Detect the host IP to allow physical devices to connect to the local backend
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || '10.0.2.2'; // Fallback to Android Emulator IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:3002`;

console.log('Connecting to API at:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
});

import { useAuthStore } from './store';

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Error getting token from SecureStore', e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
