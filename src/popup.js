// src/popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const loginBtn = document.getElementById('login-btn');
    const playlistSection = document.getElementById('playlist-section');
    const playlistSelect = document.getElementById('playlist-select');
    const moodSelect = document.getElementById('mood-select');
    const generateBtn = document.getElementById('generate-btn');
  
    // Check if we already have an access token
    const { access_token } = await chrome.storage.local.get('access_token');
    if (access_token) {
      await loadPlaylists();
    } else {
      statusDiv.innerText = 'Please log in to Spotify';
      playlistSection.style.display = 'none';
    }
  
    loginBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'authorize' }, (response) => {
        if (response.status === 'ok') {
          loadPlaylists();
        } else {
          statusDiv.innerText = `Authorization failed: ${response.error || ''}`;
        }
      });
    });
  
    generateBtn.addEventListener('click', () => {
      const playlistId = playlistSelect.value;
      const mood = moodSelect.value;
      statusDiv.innerText = 'Generating playlist...';
  
      chrome.runtime.sendMessage({ action: 'generateMoodPlaylist', playlistId, mood }, (response) => {
        if (response && response.playlistUrl) {
          statusDiv.innerHTML = `New playlist created: <a href="${response.playlistUrl}" target="_blank">Open in Spotify</a>`;
        } else if (response && response.error) {
          statusDiv.innerText = `Failed: ${response.error}`;
        } else {
          statusDiv.innerText = 'An unknown error occurred.';
        }
      });
    });
  
    function loadPlaylists() {
      statusDiv.innerText = 'Fetching your playlists...';
      chrome.runtime.sendMessage({ action: 'getPlaylists' }, (playlists) => {
        if (playlists && playlists.items) {
          playlistSelect.innerHTML = '';
          playlists.items.forEach(pl => {
            const opt = document.createElement('option');
            opt.value = pl.id;
            opt.textContent = pl.name;
            playlistSelect.appendChild(opt);
          });
          playlistSection.style.display = 'block';
          statusDiv.innerText = 'Select a playlist and mood.';
        } else {
          statusDiv.innerText = 'No playlists found or error occurred.';
          playlistSection.style.display = 'none';
        }
      });
    }
  });
  