import { readdir } from 'fs/promises';
import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';
import type {CentralaResponse} from '../../libs/types';

const directoryPath = './src/s02/01-audio-i-interfejs-glosowy/przesluchania';

try {
    let allTexts: string[] = [];
    console.log(`Reading directory: ${directoryPath}`);
    const files = await readdir(directoryPath);
    const mp3Files = files.filter(file => file.endsWith('.m4a'));

    for (const file of mp3Files) {
        let text = '';
        const txtFile = Bun.file(join(directoryPath, file.replace('.m4a', '.txt')));
        const txtFileExists = await txtFile.exists();
        console.log(`Found audio file: ${file}, txt file exists: ${txtFileExists}`);

        if (!txtFileExists) {
            const filePath = join(directoryPath, file);
            console.log(`Found audio file: ${filePath}`);
            const transcription = await OpenAIService.transcribeByGroq(filePath);
            await Bun.write(txtFile, transcription);
            text = transcription;
        } else {
            text = await txtFile.text();
        }

        allTexts.push(text);
    }

    const systemPrompt = `Wciel się w rolę detektywa. Zapoznaj się z poniższymi zeznaniami świadków odpowiedz na pytanie: na jakiej ulicy znajduje się uczelnia, 
    na której wykłada Andrzej Maj. Użyj własnej wiedzy, aby określić nazwę ulicy. Pamiętaj, że zeznania świadków mogą być sprzeczne, niektórzy z nich mogą się mylić, a inni odpowiadać w dość dziwaczny sposób.
    W odpowiedzi podaj tylko nazwę ulicy, lub jeśli nie jesteś pewien, wpisz "nie wiem".
    Zeznania:\n\n ${allTexts.join('\n=====================\n')}`;
    // console.log(`System prompt: ${systemPrompt}`);
    const deduct = await OpenAIService.askLLM(systemPrompt, 'Na jakiej ulicy znajduje się uczelnia, na której wykłada Andrzej Maj?', 'gpt-4o', true);
    console.log(`Deduction: ${deduct}`);

    const response: CentralaResponse = {
        task: 'mp3',
        apikey: process.env.API_KEY || '',
        answer: <string>deduct
    }

    console.log('Sending response to Centrala...');
    const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
    });
    console.log('Response from Centrala:', await centralaRequest.json());
} catch (error) {
    console.error('Error reading directory:', error);
}
