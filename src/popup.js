// src/popup.js
import {  
    getCurrentUserProfile
  } from './utils/spotifyApi.js';

// Wait for the DOM to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", async () => {
  // Get references to the DOM elements
  const statusDiv = document.getElementById("status");
  const loginBtn = document.getElementById("login-btn");
  const playlistSection = document.getElementById("playlist-section");
  const playlistSelect = document.getElementById("playlist-select");
  const moodSelect = document.getElementById("mood-select");
  const generateBtn = document.getElementById("generate-btn");

  // Check if we already have an access token stored locally
  const { access_token } = await chrome.storage.local.get("access_token");


  if (access_token) {
    await loadPlaylists();
    // If access token exists, load the user's playlists
  } else {
    // If no access token, prompt the user to log in
    statusDiv.innerText = "Please log in to Spotify";
    playlistSection.style.display = "none";
  }

  // Add click event listener to the login button
  loginBtn.addEventListener("click", () => {
    // Send a message to the background script to authorize the user
    chrome.runtime.sendMessage({ action: "authorize" }, (response) => {
      if (response.status === "ok") {
        // If authorization is successful, load the playlists
        loadPlaylists();
      } else {
        // If authorization fails, display an error message
        statusDiv.innerText = `Authorization failed: ${response.error || ""}`;
      }
    });
  });

  // Add click event listener to the generate button
  generateBtn.addEventListener("click", () => {
    // Get the selected playlist ID and mood
    const playlistId = playlistSelect.value;
    const mood = moodSelect.value;
    const playlistName = playlistSelect.options[playlistSelect.selectedIndex].text;
    statusDiv.innerText = "Generating playlist...";
    // disbale the generate button
    generateBtn.disabled = true;

    // Send a message to the background script to generate a mood-based playlist
    chrome.runtime.sendMessage({ action: "generateMoodPlaylist", playlistName, playlistId, mood }, (response) => {
      if (response && response.playlistUrl) {
        // If playlist generation is successful, display the playlist link
        statusDiv.innerHTML = `New playlist created: <a href="${response.playlistUrl}" target="_blank">Open in Spotify</a>`;
      } else if (response && response.error) {
        // If there is an error, display the error message
        statusDiv.innerText = `Failed: ${response.error}`;
      } else {
        // If an unknown error occurs, display a generic error message
        statusDiv.innerText = "An unknown error occurred.";
      }
      generateBtn.disabled = false;
    });
  });

  // Function to load the user's playlists
  async function loadPlaylists() {
    console.log("loadPlaylists...");
    statusDiv.innerText = "Fetching your playlists...";
    // Send a message to the background script to get the user's playlists
    chrome.runtime.sendMessage({ action: "getPlaylists" }, (playlists) => {
      if (playlists && playlists.items) {
        // If playlists are found, populate the playlist select element
        playlistSelect.innerHTML = "";
        playlists.items.forEach((pl) => {
          const opt = document.createElement("option");
          opt.value = pl.id;
          opt.textContent = pl.name;
          playlistSelect.appendChild(opt);
        });

        //hide the login button and show the playlist section
        loginBtn.style.display = "none";
        playlistSection.style.display = "block";
        statusDiv.innerText = "Select a playlist and mood.";
      } else {
        // If no playlists are found or an error occurs, display an error message
        statusDiv.innerText = "No playlists found or error occurred.";
        playlistSection.style.display = "none";

        generateBtn.disabled = false;
      }
    });
  }
});
