// src/utils/spotifyApi.js
import { getTokens } from "./storage.js";

async function getAccessToken() {
  const { access_token } = await getTokens();
  if (!access_token) {
    throw new Error("No access token found. Please authorize first.");
  }
  return access_token;
}


export async function getUserPlaylists() {
  const token = await getAccessToken();
  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch playlists: ${errorText}`);
  }
  return res.json();
}

export async function getPlaylistTracks(playlistId) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch playlist tracks: ${errorText}`);
  }
  return res.json();
}

export async function createPlaylist(userId, name, description = "Mood-based playlist") {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create playlist: ${errorText}`);
  }
  return res.json();
}

export async function addTracksToPlaylist(playlistId, trackUris) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add tracks to playlist: ${errorText}`);
  }
  return res.json();
}

export async function getCurrentUserProfile() {
  console.log("getCurrentUserProfile");
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch current user profile: ${errorText}`);
  }
  return res.json();
}
