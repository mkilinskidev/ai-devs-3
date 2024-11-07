
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function askLLM(systemPrompt: string, question: string, model: string, cleanData = false): Promise<OpenAI.Chat.ChatCompletion | string> {
  const openai = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ];

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: model,
      temperature: 0
    });

    if (cleanData) {
      return chatCompletion.choices[0].message.content || '';
    } else {
      return chatCompletion;
    }
  } catch (error: any) {
    console.error("Error in OpenAI completion:", error.error.message);
    throw error.error.message;
  }
}