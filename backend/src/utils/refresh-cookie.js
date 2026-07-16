const storageService = require('../services/storage.service');

const REFRESH_COOKIE_NAME = 'carvault_rt';
const REFRESH_COOKIE_PATH = '/api/auth';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function isNativeClient(req) {
  return req.get('X-Carvio-Client') === 'ios-native';
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/**
 * Build auth JSON response: always set HttpOnly cookie.
 * Include refreshToken in body only for native clients (Capacitor).
 */
async function sendAuthResponse(req, res, { user, token, refreshToken }, status = 200) {
  setRefreshCookie(res, refreshToken);
  const signedUser = await storageService.signAssets(user);
  const payload = { user: signedUser, token };
  if (isNativeClient(req)) {
    payload.refreshToken = refreshToken;
  }
  return res.status(status).json(payload);
}

function sendRefreshResponse(req, res, { token, refreshToken }) {
  setRefreshCookie(res, refreshToken);
  const payload = { token };
  if (isNativeClient(req)) {
    payload.refreshToken = refreshToken;
  }
  return res.json(payload);
}

function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
}

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  isNativeClient,
  setRefreshCookie,
  clearRefreshCookie,
  sendAuthResponse,
  sendRefreshResponse,
  getRefreshTokenFromRequest,
};
