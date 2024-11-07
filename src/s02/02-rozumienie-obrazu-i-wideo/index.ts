import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import * as OpenAIService from '../../libs/OpenAIService';

async function ProcessFile(file: string): Promise<{file: string, response: string}> {
    const filePath = join(__dirname, 'images', file);
    const fileData = await readFile(filePath);
    const fileBase64 = fileData.toString('base64');

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: "Analyze the provided map segment of a city in Poland. Identify the city depicted and provide its name. Pay attention to the map details, street names, bus stops, etc. Consider the presence of granaries and fortresses in this city to assist in your reasoning. Take your time to reflect on the details before giving your answer."
        },
        {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${fileBase64}`,
                        detail: "auto"
                    }
                },
                {
                    type: "text",
                    text: "What city in Poland is on the map?"
                }
            ]
        }
    ]

    console.log(`🖼️ Processing file: ${file}`);
    const chatCompletion = await OpenAIService.completion(messages, 'gpt-4o', 0.5);

    return { file, response: chatCompletion.choices[0].message.content || '' };
}


async function processFiles(): Promise<void> {
    console.log('📄 Processing files...')
    const filesFolder = join(__dirname, 'images');
    const files = await readdir(filesFolder);
    const pngFiles = files.filter((file) => file.endsWith('.png'));

    const result = await Promise.all(pngFiles.map(file => ProcessFile(file)));

    console.table(result);
}

await processFiles();