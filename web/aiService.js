import { HfInference } from '@huggingface/inference';

const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN || '';

const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

const limitValue = (value, depth = 0) => {
  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (depth >= 3) {
    return '[Max depth reached]';
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map((item) => limitValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .slice(0, 20)
      .reduce((accumulator, [key, nestedValue]) => {
        accumulator[key] = limitValue(nestedValue, depth + 1);
        return accumulator;
      }, {});
  }

  return String(value);
};

export const buildAIContext = (contextData = '') => {
  if (!contextData) {
    return 'No extra app data was provided.';
  }

  if (typeof contextData === 'string') {
    return contextData;
  }

  return JSON.stringify(limitValue(contextData), null, 2);
};

const buildPrompt = (userQuestion, contextData) => `<s>[INST] Context: ${buildAIContext(
  contextData
)}\nQuestion: ${userQuestion} [/INST]`;

const getReadableError = (error) => {
  const message = String(error?.message || error || '');
  const normalizedMessage = message.toLowerCase();

  if (!HF_TOKEN) {
    return 'AI token is missing. Add VITE_HUGGINGFACE_API_TOKEN to your .env file.';
  }

  if (
    normalizedMessage.includes('unauthorized') ||
    normalizedMessage.includes('invalid token') ||
    normalizedMessage.includes('authentication') ||
    normalizedMessage.includes('api key') ||
    normalizedMessage.includes('token')
  ) {
    return 'Invalid Hugging Face API token. Check VITE_HUGGINGFACE_API_TOKEN in .env.';
  }

  if (
    normalizedMessage.includes('cors') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('network request failed')
  ) {
    return 'Network or CORS issue while reaching Hugging Face inference API.';
  }

  if (
    normalizedMessage.includes('overloaded') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('503') ||
    normalizedMessage.includes('502') ||
    normalizedMessage.includes('500')
  ) {
    return 'Hugging Face inference API is unavailable or overloaded right now.';
  }

  return message || 'Unknown AI service error.';
};

export const askAI = async (userQuestion, contextData = '') => {
  if (!hf) {
    const message = 'AI token is missing. Add VITE_HUGGINGFACE_API_TOKEN to your .env file.';
    console.error('AI Error:', message);
    return message;
  }

  try {
    const prompt = buildPrompt(userQuestion, contextData);

    const response = await hf.textGeneration({
      model: HF_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    const generatedText = String(response?.generated_text || '').trim();

    if (!generatedText) {
      throw new Error('Empty response from Hugging Face inference API.');
    }

    return generatedText;
  } catch (error) {
    const readableError = getReadableError(error);
    console.error('AI Error:', {
      model: HF_MODEL,
      message: readableError,
      originalError: error,
    });
    return `AI request failed: ${readableError}`;
  }
};
