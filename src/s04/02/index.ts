import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';
import Centrala from '../../libs/Centrala';



const preapreFineTunningData = async () => {
    const file = Bun.file(join(__dirname, 'data', 'fine-tunning-data.jsonl'));
    if (! await file.exists()) {
        let data = '';

        const correctFile = Bun.file(join(__dirname, 'data/source', 'correct.txt'));
        const correct = await correctFile.text();
        const correctLines = correct.split('\n');

        for (const line of correctLines) {
            const json = {
                messages: [
                    {
                        role: "system",
                        content: "Validate numbers"
                    },
                    {
                        role: "user",
                        content: line
                    },
                    {
                        role: "assistant",
                        content: "correct"
                    }
                ]
            }

            data += line !== '' ? JSON.stringify(json) + '\n' : '';
        }

        const incorrectFile = Bun.file(join(__dirname, 'data/source', 'incorrect.txt'));
        const incorrect = await incorrectFile.text();
        const incorrectLines = incorrect.split('\n');

        for (const line of incorrectLines) {
            const json = {
                messages: [
                    {
                        role: "system",
                        content: "Validate numbers"
                    },
                    {
                        role: "user",
                        content: line
                    },
                    {
                        role: "assistant",
                        content: "incorrect"
                    }
                ]
            }
            data += line !== '' ? JSON.stringify(json) + '\n' : '';
        }

        await Bun.write(join(__dirname, 'data', 'fine-tunning-data.jsonl'), data);
    }
}

const processData = async (): Promise<{ id: string, result: string }[]> => {
    const fileToVerify = Bun.file(join(__dirname, 'data/source', 'verify.txt'));
    const verify = await fileToVerify.text();
    const verifyLines = verify.split('\n').filter(line => line.trim() !== '');
    const data = await Promise.all(verifyLines.map(async (line, index) => {
        const id = line.split('=')[0].trim();
        const data = line.split('=')[1];
        const result = <string> await OpenAIService.askLLM("Validate numbers", data, 'ft:gpt-4o-mini-2024-07-18:personal:aidevs-s03e02:AYEVdTCx', true);
        return { id, result };
    }));

    return data;
}

const main = async () => {
    //await preapreFineTunningData();
    const data = await processData();
    const correctData = data.filter(d => d.result === 'correct');
    const answer = correctData.map(data => {
        return data.id;
    });

    const centrala = new Centrala('research', answer);
    const response = await centrala.sendReport();
    console.log(response);
}


await main().catch(console.error);