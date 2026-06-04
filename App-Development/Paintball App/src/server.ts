import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

interface DiagnoseRequest {
  markerName: string;
  symptomDescription: string;
  cause?: string;
}

app.post('/api/diagnose', async (req, res) => {
  const { markerName, symptomDescription, cause } = req.body as DiagnoseRequest;

  if (!markerName || !symptomDescription) {
    return res.status(400).json({ error: 'Missing markerName or symptomDescription' });
  }

  const isFollowUp = symptomDescription.includes('-- FOLLOW UP:');

  const SYSTEM_PROMPT = `
You are "Pocket Tech", a master paintball technician.
Your goal is to diagnose marker failures and provide precise maintenance instructions.

Tone: "Explain Like I'm 5" (ELI5). Use simple terms.

${
  isFollowUp
    ? 'IMPORTANT: This is a RECURRING or FOLLOW-UP issue. The user tried previous things and they failed. DO NOT suggest standard first-line fixes. Analyze why the previous fix might have failed and suggest a secondary or obscure culprit.'
    : 'IMPORTANT: This is a FRESH case. Do not mention any previous fits or failed attempts. Provide the most statistically likely "first-line" diagnosis based solely on the current symptom.'
}

CRITICAL TECHNICAL NOTE:
- Many frame leaks are caused by Solenoid Gaskets.
- IMPORTANT: You MUST use the term "Solenoid Gasket" for both the 'name' and 'size' fields if the part is a gasket and does not have a standard O-ring size (NEVER use "N/A" or "custom molded gasket").
- Planet Eclipse OP Core (CS3, 180R): 14x2 metric seals on bolt guide are common failure points.
- Dye DSR+/M3+: Check manifold seals and LPR (on legacy).
- IMPORTANT MANUAL LINKS:
  - For ALL Planet Eclipse markers: manualUrl MUST be "https://planeteclipse.com/manuals/"
  - For ALL Dye markers: manualUrl MUST be "https://shop.dyepaintball.com/pages/manuals?srsltid=AfmBOopmzZVdeMBIUggvYv6RrC8_cQljkL_5WVlFEetLCwMajVOUda7A"
- Luxe: Often requires more lube. Check manifold/frame interface.
- Autocockers: 3-way alignment and LPR/HPR balance are key.

Required JSON Structure:
{
  "markerName": string,
  "symptom": string,
  "cause": string,
  "diagnosis": "Short ELI5 explanation.",
  "recommendedOrings": [{ "name": "string", "size": "string", "location": "string", "quantity": number }],
  "steps": ["Step 1...", "Step 2..."],
  "techTip": "One piece of expert advice.",
  "manualUrl": "string"
}
`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Marker: ${markerName}\nSymptom: ${symptomDescription}\nCause: ${cause || 'Unknown'}\n\nRespond with ONLY valid JSON, no other text.`,
        },
      ],
    });

    if (!response.content[0] || response.content[0].type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let responseText = response.content[0].text;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }
    const diagnosis = JSON.parse(responseText);
    return res.json(diagnosis);
  } catch (error: any) {
    console.error('Diagnosis error:', error);

    let diagnosis = 'The Technical AI system is currently unavailable.';
    let steps = [
      'Consult the official Planet Eclipse user manual.',
      'Check for common symptoms in the provided list.',
      'Contact a local certified paintball technician.',
    ];
    let techTip = 'Safety First: Always de-gas your marker and remove the hopper/paintballs before service!';

    const errorMessage = error?.message || '';
    const statusCode = error?.status || 0;

    if (statusCode === 429 || errorMessage.includes('429') || errorMessage.includes('QUOTA_EXCEEDED')) {
      diagnosis = 'The AI Tech is currently overwhelmed with requests.';
      steps = [
        'Wait 30-60 seconds and try again.',
        'Check the "Common Symptoms" section on the previous screen.',
        "If you've diagnosed this before, check your 'History' tab.",
      ];
      techTip = 'Pro Tip: If you\'re at a large event, local tech booths can help immediately!';
    } else if (statusCode === 401 || statusCode === 403 || errorMessage.includes('API_KEY')) {
      diagnosis = 'System Configuration Error (Authentication Failed).';
      steps = [
        'Please check if the CLAUDE_API_KEY is correctly set in the environment.',
        'Contact support if this persists.',
        'Use the manual override: Follow the steps in your marker\'s physical manual.',
      ];
    } else if (errorMessage.includes('Safety') || errorMessage.includes('blocked')) {
      diagnosis = 'The AI technician blocked this request for safety/policy reasons.';
      steps = [
        'Ensure your description doesn\'t contain sensitive or prohibited content.',
        'Try rephrasing your symptom description.',
        'Focus strictly on technical paintball marker hardware issues.',
      ];
    }

    return res.json({
      markerName,
      symptom: symptomDescription,
      diagnosis,
      recommendedOrings: [],
      steps,
      techTip,
    });
  }
});

interface FeedbackSubmission {
  markerName: string;
  symptom: string;
  diagnosis: string;
  rating: number;
  feedback?: string;
  timestamp: number;
}

const feedbackStore: FeedbackSubmission[] = [];

app.post('/api/feedback', async (req, res) => {
  const { markerName, symptom, diagnosis, rating, feedback } = req.body;

  if (!markerName || !symptom || !diagnosis || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const submission: FeedbackSubmission = {
    markerName,
    symptom,
    diagnosis,
    rating,
    feedback: feedback || '',
    timestamp: Date.now(),
  };

  feedbackStore.push(submission);

  // Send to HubSpot form submission
  const HUBSPOT_FORM_ENDPOINT = 'https://api.hsforms.com/submissions/v3/integration/submit/242667089/0b37c22a-bab7-49f9-a514-cdaed3cb67d4';
  try {
    await fetch(HUBSPOT_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: [
          { name: 'email', value: 'feedback@pockettech.app' },
          { name: 'marker', value: markerName },
          { name: 'symptom', value: symptom },
          { name: 'rating', value: rating.toString() },
          { name: 'message', value: feedback || '' },
        ],
      }),
    });
    console.log(`✅ Feedback sent to HubSpot: ${markerName} - ${rating} stars`);
  } catch (error) {
    console.error('❌ Failed to send feedback to HubSpot:', error);
  }

  return res.json({ success: true, id: feedbackStore.length - 1 });
});

app.get('/api/feedback', async (req, res) => {
  return res.json({ count: feedbackStore.length, feedback: feedbackStore });
});

app.listen(PORT, () => {
  console.log(`Pocket Tech backend running on http://localhost:${PORT}`);
});
