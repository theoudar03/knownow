const { GoogleGenAI } = require('@google/genai');

let ai = null;

async function generateMemeCaption(userInput, textType = 'double') {
  const isSingle = textType === 'single';

  const fallback = {
    captions: isSingle
      ? [
          { text: "When the assignment was due yesterday", tone: "relatable" },
          { text: "Professor said 'this won't be on the exam'... it was", tone: "sarcastic" },
          { text: "Me pretending I understood the lecture", tone: "exaggerated" }
        ]
      : [
          { topText: "Me chilling", bottomText: "College: surprise update", tone: "relatable" },
          { topText: "Trying to sleep", bottomText: "My 8 AM responsibilities", tone: "exaggerated" },
          { topText: "Everything is fine", bottomText: "The 3 missed assignments", tone: "sarcastic" }
        ],
    context: "general",
    textType
  };

  if (!ai) {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      console.error('Gemini API key is not configured.');
      return fallback;
    }
  }

  const doublePrompt = `Generate 3 different meme captions for the given academic message.

Each caption should have:
* Top text (short, punchy)
* Bottom text (short, punchy)
* Tone (one word: relatable, sarcastic, exaggerated, or dramatic)

Also detect the overall context in one word (e.g. exam, deadline, stress, party).

Return ONLY in this JSON format:

{
  "captions": [
    { "topText": "...", "bottomText": "...", "tone": "..." },
    { "topText": "...", "bottomText": "...", "tone": "..." },
    { "topText": "...", "bottomText": "...", "tone": "..." }
  ],
  "context": "...",
  "textType": "double"
}

Message: {{USER_INPUT}}`;

  const singlePrompt = `Generate 3 different single-line meme captions for the given academic message.

Each caption should have:
* Text (one short funny line)
* Tone (one word: relatable, sarcastic, exaggerated, or dramatic)

Also detect the overall context in one word (e.g. exam, deadline, stress, party).

Return ONLY in this JSON format:

{
  "captions": [
    { "text": "...", "tone": "..." },
    { "text": "...", "tone": "..." },
    { "text": "...", "tone": "..." }
  ],
  "context": "...",
  "textType": "single"
}

Message: {{USER_INPUT}}`;

  const prompt = (isSingle ? singlePrompt : doublePrompt).replace('{{USER_INPUT}}', userInput);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    const captionText = response.text.trim();
    console.log("Raw AI Output:", captionText);

    try {
      const firstBrace = captionText.indexOf('{');
      const lastBrace = captionText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        console.warn("No JSON object found in response");
        return fallback;
      }

      const jsonStr = captionText.substring(firstBrace, lastBrace + 1);
      const parsedData = JSON.parse(jsonStr);

      if (!parsedData.captions || !Array.isArray(parsedData.captions) || parsedData.captions.length === 0) {
        console.warn("Validation failed. Missing captions array");
        return fallback;
      }

      // Ensure textType is set in the response
      parsedData.textType = textType;
      return parsedData;
    } catch (parseError) {
      console.warn("JSON parsing failed, falling back to default.", parseError);
      return fallback;
    }

  } catch (error) {
    console.error('Error generating meme caption:', error.message);
    return fallback;
  }
}

module.exports = {
  generateMemeCaption
};
