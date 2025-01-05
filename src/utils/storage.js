// src/utils/storage.js
 

export async function setTokens(tokens) {
  await chrome.storage.local.set({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: Date.now() + tokens.expires_in * 1000
  });
}

export async function getTokens() {

  return chrome.storage.local.get(['access_token', 'refresh_token', 'expires_in']);
}
