import { join } from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import Centrala from '../../libs/Centrala';


const getFile = async (fileName: string): Promise<string> => {
    const file = Bun.file(join(__dirname, 'storage', fileName));
    if (! await file.exists()) {
        await fetch(`${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/${fileName}`)
            .then(async (file) => {
                if (fileName.endsWith('.json')) {
                    const data = await file.json();
                    await Bun.write(join(__dirname, 'storage', fileName), JSON.stringify(data));
                }

                if (fileName.endsWith('.txt')) {
                    const data = await file.text();
                    await Bun.write(join(__dirname, 'storage', fileName), data);
                }
            })
    }

    const data = await file.text();
    return data;
}


const main = async () => {
    await getFile('gps.txt');
    await getFile('gps_question.json');

    const { text, toolCalls, toolResults } = await generateText({
        model: openai('gpt-4o-mini'),
        maxSteps: 10,
        tools: {
            get_people_list: tool({
                description: 'Get people list from provided location',
                parameters: z.object({
                    location: z.string().describe('The location to get the people list for'),
                }),
                execute: async ({ location }) => {
                    const response = await fetch(`${process.env.CENTRALA_URL}/places`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            apikey: process.env.API_KEY,
                            query: location
                        })
                    });

                    const { message } = await response.json();
                    const people = message.split(' ').filter((p: string) => p !== 'BARBARA');

                    return {
                        toolResult: people
                    }
                },
            }),
            get_people_id: tool({
                description: 'Get people ID from provided name',
                parameters: z.object({
                    name: z.string().describe('The people name to get the ID for'),
                }),
                execute: async ({ name }) => {
                    const data = await fetch(`${process.env.CENTRALA_URL}/apidb`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            task: 'database',
                            apikey: process.env.API_KEY,
                            query: `select id from users where upper(username) = upper('${name}')`
                        })
                    });

                    const response = await data.json();

                    return {
                        toolResult: response.reply[0].id
                    }
                },
            }),
            get_gps: tool({
                description: 'Get GPS coordinates for provided userId',
                parameters: z.object({
                    userId: z.string().describe('The userId to get the GPS coordinates for')
                }),
                execute: async ({ userId }) => {
                    const data = await fetch(`${process.env.CENTRALA_URL}/gps`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userID: userId
                        })
                    });

                    const gps = await data.json();

                    return {
                        toolResult: gps.message
                    }
                },
            }),

        },
        onStepFinish({text, toolCalls, toolResults}) {
            console.log('=== STEP FINISHED ===');
            console.log('Text:', text);
            console.log('Tool Calls:', toolCalls);
            console.log('Tool Results:', toolResults);
        },
        prompt: `I need to get know, who is in the Lubawa city. Then I need to get the GPS coordinates for each people. I need an answer in this JSON format: 
        {
            "name": {
                "lat": 12.345...,
                "lon": 65.431...
            },
            "another_name": {
                "lat": 19.433...,
                "lon": 12.123...
            }
        }. Answer only with JSON without additional text and markdown tags. Can you do that?`,

    });

    console.log(text);

    const centrala = new Centrala('gps', JSON.parse(text));
    const response = await centrala.sendReport();
    console.log(response);
}

await main().catch(console.error);