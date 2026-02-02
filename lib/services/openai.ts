import OpenAI from 'openai';

let openai: OpenAI | null = null;

export function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export default { getOpenAI };
