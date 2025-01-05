
import { setTokens, getTokens } from './utils/storage.js';
import { 
  getUserPlaylists,
  getPlaylistTracks,
  createPlaylist,
  addTracksToPlaylist,
  getCurrentUserProfile
} from './utils/spotifyApi.js';

import { analyzeMoods } from './utils/geminiApi.js'; 
/** 
 * Replace these with your actual Spotify App credentials.
 * IMPORTANT: For production, do NOT expose your client secret in client-side code.
 * Use a secure server or your own backend if possible. This example is for demonstration only.
 */ 
const clientId = "f7443586273348ebaffca7aba15e94b6";
const clientSecret = "abb55d2434a244a3910c25824f0abfdb";
/**
 * The redirect URI must be whitelisted in your Spotify Developer Dashboard.
 * Typically for a Chrome extension using launchWebAuthFlow, it looks like:
 * https://<your-extension-id>.chromiumapp.org/
*/
const redirectUri = "https://paakbbkbmndpmabhjmfikaedcmmgdbcp.chromiumapp.org/"; 


const scopes = [
  "user-read-private",
  "playlist-read-private",
  "playlist-modify-private"
].join(" ");


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authorize') {
    authorizeSpotify()
      .then(() => sendResponse({ status: 'ok' }))
      .catch(err => sendResponse({ status: 'error', error: err.toString() }));
    return true;
  }

  if (message.action === 'getPlaylists') {
    getUserPlaylists()
      .then(data => sendResponse(data))
      .catch(err => {
        console.error('Failed to fetch playlists:', err);
        sendResponse(null);
      });
    return true;
  }

  if (message.action === 'generateMoodPlaylist') {
    generateMoodPlaylist(message.playlistName ,message.playlistId, message.mood)
      .then(data => sendResponse(data))
      .catch(err => {
        console.error('Failed to generate mood playlist:', err);
        sendResponse(null);
      });
    return true;
  }
});

async function authorizeSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  
  const redirectResponse = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  });

  const code = new URL(redirectResponse).searchParams.get('code');
  if (!code) {
    throw new Error("No authorization code returned from Spotify");
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("Failed to obtain access token");
  }
  await setTokens(tokenData);
}

/**
 * Main flow to read playlist tracks, get moods via an LLM, filter by chosen mood, and create a new playlist.
 */
async function generateMoodPlaylist(playlistName,playlistId, mood) {
  // 1. Get basic playlist track info (title, artist, IDs)
  const playlistData = await getPlaylistTracks(playlistId);
  const trackItems = playlistData.items.filter(item => item.track && item.track.id);

  // Build an array of minimal data for the LLM
  const trackInfo = trackItems.map(item => ({
    track_id: item.track.id,
    track_name: item.track.name,
    artist_name: item.track.artists?.map(a => a.name).join(", ")
  }));

  // 2. Call Gemini (or any LLM) to determine each track's mood based on title/artist
  const tracksWithMood = await determineMoodWithGemini(trackInfo,mood);

  // 3. Filter tracks that match the user's chosen mood
  const filtered = tracksWithMood.filter(t => t.mood === mood);

  if (filtered.length === 0) {
    return { error: 'No tracks match this mood.' };
  }

  // Convert to Spotify URIs
  const uris = filtered.map(f => `spotify:track:${f.track_id}`);

  // 4. Create a new playlist
  const user = await getCurrentUserProfile(); 
  console.log("user:",user);
  const newPlaylist = await createPlaylist(
    user.id, 
    ` ${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood Playlist for ${playlistName} `
  );

  // 5. Add the filtered URIs
  await addTracksToPlaylist(newPlaylist.id, uris);

  return { playlistUrl: newPlaylist.external_urls.spotify };
}

 
async function determineMoodWithGemini(tracks,mood) {
 
  let response;
  try {
     response = await analyzeMoods(tracks);
  } catch (error) {
    console.error("Error calling analyzeMoods:", error);
  }

  const happyTracks = response.filter(track => track.mood === mood);
  return happyTracks;
 
}

console.log('Background service worker running (Gemini-based version)');
