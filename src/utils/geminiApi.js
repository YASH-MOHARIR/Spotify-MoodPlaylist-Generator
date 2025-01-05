// geminiApi.js

// API key for accessing the Gemini API (Replace with your actual API key)
const API_KEY = "";

/**
 * Function to get a response from the Gemini API based on a given prompt
 * @param {string} prompt - The input prompt for the Gemini API
 * @returns {Promise<Object|null>} - The parsed JSON response or null if an error occurs
 */
export async function getGeminiResponse(prompt) {
  // Construct the API URL with the provided API key
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    // Make a POST request to the Gemini API with the prompt
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // Check if the response is not OK (status code not in the range 200-299)
    if (!response.ok) {
      console.error(`Gemini API Error: ${response.statusText}`);
      return null;
    }

    // Parse the JSON response from the API
    const data = await response.json();

    // Extract the generated response text from the API response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Check if the response text is not available
    if (!responseText) {
      console.error("Invalid response format from Gemini:", data);
      return null;
    }

    // Clean response from potential markdown blocks and parse JSON
    const cleanResponse = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    // Log any errors that occur during the fetch operation
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

// Example usage (in your background.js or other appropriate location):

/**
 * Function to analyze the moods of tracks based on their titles and artist names
 * @param {Array} tracks - Array of track objects containing track_id, track_name, and artist_name
 * @returns {Promise<Array|null>} - The mood analysis results or null if an error occurs
 */
async function analyzeMoods(tracks) {
  // Construct the prompt for the Gemini API
  const prompt = `
  Analyze the mood of these songs based on their titles and artist names. 
  Return the results as a JSON array with the following structure:
  [
    { 
      "track_id": "Original Track ID",
      "track_name": "Original Track Name", 
      "artist_name": "Original Artist Name", 
      "mood": "Single Inferred Mood" 
    }
  ]
  choose moods only from: happy, sad, romantic, chill, energetic.
  ensure that the mood is categorised only from the give 5 moods. Assign a mood which is closest to a mood from the given 5 moods. 
  Here is the input data: ${JSON.stringify(tracks)}
  `;

  // Get the response from the Gemini API
  const geminiResponse = await getGeminiResponse(prompt);

  // Check if the response is valid
  if (geminiResponse) {
    // Return the mood analysis results
    return geminiResponse;
  } else {
    // Log an error if the mood analysis fails
    console.error("Failed to get mood analysis from Gemini.");
    return null;
  }
}

// Export the analyzeMoods function for use in other modules
export { analyzeMoods };
