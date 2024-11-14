import * as OpenAIService from '../../libs/OpenAIService';
import type { CentralaResponse } from '../../libs/types';
import {join} from 'path';

const createDallePrompt = async (description: string): Promise<string> => {
    console.log('Creating DALL-E prompt...');
    const systemPrompt = 'Create an DALL-E prompt based on the following description';
    const response = <string>await OpenAIService.askLLM(systemPrompt, description, 'gpt-4o', true);
    return response;
}

const generateImage = async (prompt: string, model: string = "dall-e-3"): Promise<string> => {4
    console.log('Generating image...');
    const image = await OpenAIService.generateImage(prompt, model);
    return image;
}

const opisRobotaURL = `${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/robotid.json`
const opisRobotaPromise = await fetch(opisRobotaURL);
const opisRobota = await opisRobotaPromise.json();

const dallePrompt = await createDallePrompt(opisRobota.description);

const image = await generateImage(dallePrompt);
console.log('Image URL:', image);

const file = await fetch(image);
await Bun.write(join(__dirname, 'robot.png'), file);

const response: CentralaResponse = {
    task: 'robotid',
    apikey: process.env.API_KEY || '',
    answer: image
}

console.log('Sending response to Centrala...');
const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
});

const centralaResponse = await centralaRequest.json();
console.log(centralaResponse);