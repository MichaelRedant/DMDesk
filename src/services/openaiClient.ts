interface ChatResult {
  content: string;
  totalTokens?: number;
}

export interface ChatCompletionMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  apiKey: string;
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

export async function generateChatCompletion({
  apiKey,
  messages,
  model = DEFAULT_MODEL,
  temperature = 0.4,
  signal
}: ChatRequest): Promise<ChatResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      messages
    }),
    signal
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';

  return {
    content,
    totalTokens: data.usage?.total_tokens
  };
}
