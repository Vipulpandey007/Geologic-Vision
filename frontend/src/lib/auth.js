import Cookies from 'js-cookie';
import api from './axios';

export function saveTokens(accessToken, refreshToken) {
  Cookies.set('accessToken', accessToken, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  Cookies.set('refreshToken', refreshToken, {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

export function clearTokens() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
}

export function getAccessToken() {
  return Cookies.get('accessToken');
}

export async function fetchCurrentUser() {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch {
    return null;
  }
}
