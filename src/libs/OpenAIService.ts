
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import Groq from "groq-sdk";
import fs from "fs";

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

export async function completion(messages: ChatCompletionMessageParam[], model: string, temperature = 0): Promise<OpenAI.Chat.ChatCompletion> {
  const openai = new OpenAI();

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model,
      temperature
    });

    return chatCompletion;
  } catch (error: any) {
    console.error("Error in OpenAI completion:", error.error.message);
    throw error.error.message;
  }
}

export async function generateImage(prompt: string, model: string = "dall-e-3"): Promise<string> {
  const openai = new OpenAI();

  try {
    const image = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    return image.data[0].url || '';
  } catch (error: any) {
    console.error("Error in OpenAI image generation:", error.error.message);
    throw error.error.message;
  }
}

export async function transcribeByGroq(filePath: string): Promise<string> {
  const groq = new Groq();

  try {
    console.log(`Transcribing audio file: ${filePath}`);
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      language: 'pl',
      model: 'whisper-large-v3'
    });
    return transcription.text;
  } catch (error: any) {
    console.error("Error in Groq transcription:", error.error.message);
    throw error.error.message;
  }
}