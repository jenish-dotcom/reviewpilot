const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TONE_PROMPTS = {
  professional: 'professional and formal, maintaining a business-appropriate tone',
  friendly: 'warm, friendly and conversational, making customers feel appreciated',
  apologetic: 'empathetic and apologetic when needed, focusing on resolution and customer satisfaction',
};

async function generateReviewResponse({ reviewerName, rating, reviewText, tone = 'professional', businessName = 'our business' }) {
  const toneDescription = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;

  const systemPrompt = `You are a customer service representative for ${businessName}.
Your job is to write responses to Google reviews.
Be ${toneDescription}.
Keep responses concise (2-4 sentences for short reviews, 3-6 for detailed ones).
Always thank the reviewer by name if provided.
For negative reviews (1-3 stars), acknowledge the issue and offer to make it right.
For positive reviews (4-5 stars), express genuine gratitude.
Never be defensive or argumentative.
Do not include subject lines or headers — just the response text.`;

  const userPrompt = `Write a response to this Google review:

Reviewer: ${reviewerName || 'A customer'}
Rating: ${rating}/5 stars
Review: "${reviewText}"

Write the response now:`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return message.content[0].text.trim();
}

module.exports = { generateReviewResponse };
