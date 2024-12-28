 
const API_KEY = "AIzaSyDvFv2gV1Wq-U1i7c4p6_yhFsjh8RjcqRk"; // Replace with your actual API key
 
export async function getGeminiResponse(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
console.log("url:",url);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      console.error(`Gemini API Error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // Extract the generated response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("Invalid response format from Gemini:", data);
      return null;
    }

    // Clean response from potential markdown blocks and parse JSON
    const cleanResponse = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}
 
// Example usage (in your background.js or other appropriate location):
async function analyzeMoods(tracks) {
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

  const geminiResponse = await getGeminiResponse(prompt);

  if (geminiResponse) {
    // console.log("Gemini response:", geminiResponse);
    return geminiResponse;
  } else {
    console.error("Failed to get mood analysis from Gemini.");
    return null;
  }
}

export { analyzeMoods };