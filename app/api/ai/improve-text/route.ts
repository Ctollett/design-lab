import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/services/openai';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Improve the provided text by making it clearer, more concise, or more engaging. Return only the improved text without any explanations.',
        },
        {
          role: 'user',
          content: `Improve this text: "${text}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedText = response.choices[0]?.message?.content || '';

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate text improvement' },
      { status: 500 }
    );
  }
}
