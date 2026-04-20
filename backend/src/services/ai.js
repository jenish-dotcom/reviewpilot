const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TONE_PROMPTS = {
  professional: 'Write a professional, courteous, and business-like response.',
  friendly: 'Write a warm, friendly, and personable response that feels genuine.',
  apologetic: 'Write a sincere, empathetic response that acknowledges any concerns and offers to make things right.',
};

const LENGTH_GUIDES = {
  short: 'Keep the response concise (2-3 sentences).',
  medium: 'Write a moderate length response (3-5 sentences).',
  long: 'Write a thorough response (5-8 sentences) addressing all points.',
};

async function generateReviewResponse({ review, tone = 'professional', settings = {} }) {
  const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.professional;
  const lengthGuide = LENGTH_GUIDES[settings.response_length] || LENGTH_GUIDES.medium;

  const businessContext = settings.business_name
    ? `Business name: ${settings.business_name}`
    : '';
  const businessDesc = settings.business_description
    ? `Business description: ${settings.business_description}`
    : '';
  const customInstructions = settings.custom_instructions
    ? `Additional instructions: ${settings.custom_instructions}`
    : '';
  const includeBusinessName = settings.include_business_name !== false;

  const systemPrompt = `You are an expert at writing professional responses to online reviews for businesses.
${businessContext}
${businessDesc}
${tonePrompt}
${lengthGuide}
${customInstructions}
${includeBusinessName ? 'Sign the response naturally on behalf of the business.' : 'Do not include a signature.'}
Do not use placeholders like [Name] or [Business Name]. Write a complete, ready-to-post response.
Respond only with the review response text, nothing else.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Please write a response to this customer review:\n\n"${review}"`,
      },
    ],
    system: systemPrompt,
  });

  return message.content[0].text;
}

module.exports = { generateReviewResponse };
