import { join } from 'path';
import fetch from 'node-fetch';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import * as OpenAIService from '../../libs/OpenAIService';
import { file } from 'bun';

export const analyzeFile = async (fileName: string): Promise<string> => {
    const base64 = await getBase64(fileName);
    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `Przenalizuj zdjęcie. Zidentyfikuj, czy na zdjęciu znajduje się kobieta. Jeżeli tak, przygotuj rysopis kobiety w języku polskim. Uwzględnij wszystkie szczegóły ze zdjęcia, które pomogą mi ją rozpoznać. Bądź bardzo szczegółowy.
             
            <ZASADY>
            1. Zdjęcie może być nieczytelne, zbyt ciemne lub zbyt jasne. W takim przypadku zwróć odpowiedź i zaproponuj narzędzie, które pozwoli na poprawienie jakości zdjęcia. 
            2. Jeżeli jesteś w stanie odczytać zdjęcie, i na zdjęciu znajduje się jedna kobieta, przygotuj rysopis kobiety w języku polskim. Uwzględnij wszystkie szczegóły ze zdjęć, które pomogą mi ją rozpoznać. Bądź bardzo szczegółowy. 
            
            <DOSTĘPNE_NARZĘDZIA>
            1. REPAIR - naprawia uszkodzenia na zdjęciu, np. w przypadku glitchy.
            2. DARKEN - przyciemnia zdjęcie, jeśli jest zbyt jasne.
            3. BRIGHTEN - rozjaśnia zdjęcie, jeśli jest zbyt ciemne.
            </DOSTĘPNE_NARZĘDZIA>
            `
        },
        {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${base64}`,
                        detail: "auto"
                    }
                },
                {
                    type: "text",
                    text: "Czy na zdjęciu znajduje się kobieta?"
                }
            ]
        }
    ];

    const chatCompletion = await OpenAIService.completion(messages, 'gpt-4o', 0.5);
    return chatCompletion.choices[0].message.content || '';
};

const getBase64 = async (fileName: string): Promise<string> => {
    let file = '';
    if (fileName.startsWith('https://')) {
        file = fileName;
    } else {
        file = `${process.env.CENTRALA_URL}/dane/barbara/${fileName}`;
    }
    const response = await fetch(file);
    const buffer = await response.buffer();
    const base64 = buffer.toString('base64');
    return base64;
}
