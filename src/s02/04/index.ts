import * as OpenAIService from '../../libs/OpenAIService';
import { readdir, readFile } from 'fs/promises';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { CentralaResponse } from '../../libs/types';
import { join } from 'path';

let fileSummary: { file: string, category: string }[] = [];

const processText = async (textToAnalyze: string): Promise<string> => {
    const systemPrompt = "Analyze the provided text. Identify one of the two categories: people or hardware. If the text describes people, return 'people'. If the text describes hardware, return 'hardware'. If the text does not fit either category, return 'unknown'.";
    const userPrompt = `Categorize the following text:\n${textToAnalyze}`;
    const category = <string>await OpenAIService.askLLM(systemPrompt, userPrompt, 'gpt-4o-mini', true);
    return category;
}

const ProcessTxtFile = async (txtFile: string) => {
    const summaryFile = Bun.file(join(__dirname, 'pliki_z_fabryki', `${txtFile}.summary`));
    let category = 'unknown';
    if (!await summaryFile.exists()) {
        const file = Bun.file(join(__dirname, 'pliki_z_fabryki', txtFile));
        const fileData = await file.text();

        category = await processText(fileData);
        await Bun.write(join(__dirname, 'pliki_z_fabryki', `${txtFile}.summary`), category);
    } else {
        category = await summaryFile.text();
    }

    fileSummary.push({ file: txtFile, category: category });
}

const ProcessPngFile = async (pngFile: string) => {
    const summaryFile = Bun.file(join(__dirname, 'pliki_z_fabryki', `${pngFile}.summary`));
    let category = 'unknown';
    if (!await summaryFile.exists()) {
        const filePath = join(__dirname, 'pliki_z_fabryki', pngFile);
        const fileData = await readFile(filePath);
        const fileBase64 = fileData.toString('base64');

        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: "Analyze the provided image and extract all visible text from it, preserving line breaks and the original structure as closely as possible. Include all text details, including any numbers, symbols, or special characters. Provide the result in plain text format, with each line representing a corresponding line from the image."
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
                        text: "Extract all visible text from the image."
                    }
                ]
            }
        ]

        const chatCompletion = await OpenAIService.completion(messages, 'gpt-4o', 0);
        const text = chatCompletion.choices[0].message.content || 'unknown';
        category = await processText(text);
        await Bun.write(join(__dirname, 'pliki_z_fabryki', `${pngFile}.summary`), category);

    } else {
        category = await summaryFile.text();
    }

    fileSummary.push({ file: pngFile, category: category });
}

const ProcessMp3File = async (mp3File: string) => {
    const summaryFile = Bun.file(join(__dirname, 'pliki_z_fabryki', `${mp3File}.summary`));
    let category = 'unknown';
    if (!await summaryFile.exists()) {
        const file = join(__dirname, 'pliki_z_fabryki', mp3File);
        const transcription = await OpenAIService.transcribeByGroq(file);

        await Bun.write(join(__dirname, 'pliki_z_fabryki', `${mp3File}.transcription`), transcription);

        category = await processText(transcription);
        await Bun.write(join(__dirname, 'pliki_z_fabryki', `${mp3File}.summary`), category);
    } else {
        category = await summaryFile.text();
    }

    fileSummary.push({ file: mp3File, category: category });
}


const main = async () => {
    const filesFolder = join(__dirname, 'pliki_z_fabryki');
    const files = await readdir(filesFolder);
    
    const pngFiles = files.filter((file) => file.endsWith('.png'));
    const txtFiles = files.filter((file) => file.endsWith('.txt'));
    const mp3Files = files.filter((file) => file.endsWith('.mp3'));

    console.log('📄 Processing files...');

    await Promise.all([
        ...pngFiles.map(file => ProcessPngFile(file)),
        ...txtFiles.map(file => ProcessTxtFile(file)),
        ...mp3Files.map(file => ProcessMp3File(file))
    ]);

    console.table(fileSummary.sort((a, b) => a.category.localeCompare(b.category)));

    const categorizedFiles = {
        people: fileSummary.filter(file => file.category === 'people').map(file => file.file),
        hardware: fileSummary.filter(file => file.category === 'hardware').map(file => file.file)
    }

    console.log('Sending report to Centrala...');
    const response = {
        task: 'kategorie',
        apikey: process.env.API_KEY || '',
        answer: categorizedFiles
    }

    const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
    });

    console.log('Response from Centrala:', await centralaRequest.json());

}

await main();