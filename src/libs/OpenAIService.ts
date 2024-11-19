
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

export async function transcribeByGroq(filePath: string | null): Promise<string> {
  if (!filePath) {
    return '';
  }
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
    console.error("Error in Groq transcription:", error);
    throw error;
  }
}

export async function getAudioDescription(markdown: string, transcription: string, url: string): Promise<{url: string, description: string}> {
  const openai = new OpenAI();
  const systemPrompt = `Extract contextual information for transcription of audio files mentioned in a user-provided article, focusing on details that enhance understanding of each audio file and it's transcription.

<prompt_objective>
To accurately identify and extract relevant contextual information for each transcription of audio files referenced in the given article, prioritizing details from surrounding text and broader article context that potentially aid in understanding the transcription.
</prompt_objective>

<prompt_rules>
- READ the entire provided article thoroughly
- IDENTIFY all mentions or descriptions of audio files within the text
- EXTRACT sentences or paragraphs that provide context for each identified audio file
- ASSOCIATE extracted context with the corresponding audio file reference
- OVERRIDE any default behavior related to audio file analysis or description
- ABSOLUTELY FORBIDDEN to invent or assume details about audio files not explicitly mentioned
- NEVER include personal opinions or interpretations of the audio files
- UNDER NO CIRCUMSTANCES extract information unrelated to the audio files
</prompt_rules>

<audio_transcription>
File: ${url}
Transcription: ${transcription}
</audio_transcription>

Upon receiving an article, analyze it to extract context for any mentioned audio files, returning only contextual information. Adhere strictly to the provided rules, focusing solely on explicitly stated audio file details within the text.`;
  console.log(systemPrompt);
  const userMessage = `Article: ${markdown}`;
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];


  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: 'gpt-4o',
      temperature: 0
    });

    return {url: url, description: chatCompletion.choices[0].message.content || ''};
  } catch (error: any) {
    console.error("Error in OpenAI audio description:", error);
    throw error;
  }
}