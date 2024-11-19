import TurndownService from "turndown";
import {join} from 'path';
import { JSDOM } from 'jsdom';
import * as OpenAIService from '../../libs/OpenAIService';
import type { CentralaResponse } from "../../libs/types";

interface Question {
    id: string;
    question: string;
}

const extract_body = (html_string: string): string => {
    const dom = new JSDOM(html_string);
    const body_element = dom.window.document.getElementsByTagName("body")[0];
    return body_element.innerHTML;
}

const fix_urls = (markdown: string): string => {
    const baseUrl = `${process.env.CENTRALA_URL}/dane/`;
    return markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, url) => {
        if (!url.startsWith('http')) {
            url = baseUrl + url;
        }
        return `![${altText}](${url})`;
    }).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        if (!url.startsWith('http')) {
            url = baseUrl + url;
        }
        return `[${text}](${url})`;
    });
}

const getMarkdown = async (): Promise<string> => {
    let markdownFile = Bun.file(join(__dirname, 'database', 'markdownFile.md'));
    if (!await markdownFile.exists()) {
        const html = await fetch(`${process.env.CENTRALA_URL}/dane/arxiv-draft.html`);
        const turndownService = new TurndownService();
        const htmlTxt = await html.text();
        const markdown = turndownService.turndown(extract_body(htmlTxt));
        const fixedMarkdown = fix_urls(markdown);
        await Bun.write(join(__dirname, 'database', 'markdownFile.md'), fixedMarkdown);
    }
    markdownFile = Bun.file(join(__dirname, 'database', 'markdownFile.md'));
    return await markdownFile.text();
};

const getQuestions = async (): Promise<Question[]> => {
    let questionsFile = Bun.file(join(__dirname, 'database', 'questions.txt'));
    if (!await questionsFile.exists()) {
        const questions = await fetch(`${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/arxiv.txt`);
        await Bun.write(join(__dirname, 'database', 'questions.txt'), await questions.text());
    }
    questionsFile = Bun.file(join(__dirname, 'database', 'questions.txt'));
    const fileContent = await questionsFile.text();

    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    const questions = lines.map(line => {
        const [id, question] = line.split('=');
        return { id: id.trim(), question: question.trim() };
    });

    return questions;
}

const getImagesDescription = async (): Promise<string> => {
    const imagesFile = Bun.file(join(__dirname, 'database', 'images.json'));
    const images = await imagesFile.json();
    return images;
}

const getAudioDescription = async (markdown: string): Promise<string> => {
    let audioFile = Bun.file(join(__dirname, 'database', 'audio.json'));
    if (!await audioFile.exists()) {
        const audioUrl = getAudioUrlFromMarkdown(markdown) || '';
        if (audioUrl) {
            // Fetch the audio file
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to download audio file: ${response.statusText}`);
            }
            // const audioBuffer = await response.arrayBuffer();
            // await Bun.write(join(__dirname, 'database', 'audio.mp3'), new Uint8Array(audioBuffer));

            // // Transcribe the audio file
            // const transcription = await OpenAIService.transcribeByGroq(join(__dirname, 'database', 'audio.mp3'));
            // await Bun.write(join(__dirname, 'database', 'transcription.txt'), transcription);

            const transcriptionFile = Bun.file(join(__dirname, 'database', 'transcription.txt'));
            const transcription = await transcriptionFile.text();

            // Get audio description
            const audioDescription = await OpenAIService.getAudioDescription(markdown, transcription, audioUrl);
            await Bun.write(join(__dirname, 'database', 'audio.json'), JSON.stringify(audioDescription));
        }
    }
    audioFile = Bun.file(join(__dirname, 'database', 'audio.json'));
    return await audioFile.json();
}

const getAudioUrlFromMarkdown = (markdown: string): string | null => {
    const regex = /\[([^\]]+)\]\(([^)]+\.mp3)\)/;
    const match = markdown.match(regex);
    return match ? match[2] : null;
}

const processQuestions = async (questions: Question[], article: string, images: any, audio: any): Promise<{[key: string]: string}> => {
    const answers: {[key: string]: string} = {};
    const systemPrompt = `Using the following article, answer the user's questions. There are image and audio files in the article that can be used to enhance the answers. The images are described in the <images> section and the audio file are described in the <audio> section. Return the answer as short as possible.\n\n${article}\n\n<images>\n${images}\n<audio>\n${audio}`;

    for (const question of questions) {
        const singleQuestion = question.question;
        try {
            const answer = <string>await OpenAIService.askLLM(systemPrompt, singleQuestion, 'gpt-4o', true);
            answers[question.id] = answer;
        } catch (error) {
            console.error(`Error processing question ${question.id}:`, error);
            answers[question.id] = 'Error processing this question';
        }
    }

    return answers;
}


const markdown = await getMarkdown();
const images = await getImagesDescription();
const audio = await getAudioDescription(markdown);
const questions = await getQuestions();

const answersFile = Bun.file(join(__dirname, 'database', 'answers.json'));
if (!await answersFile.exists()) {
    const answers = await processQuestions(questions, markdown, images, audio);
    await Bun.write(join(__dirname, 'database', 'answers.json'), JSON.stringify(answers));
}
const answers = await answersFile.json();
console.log(answers);

const response = {
    task: 'arxiv',
    apikey: process.env.API_KEY || '',
    answer: answers
}

const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
});

console.log('Response from Centrala:', await centralaRequest.json());

// const questions = await getQuestions();