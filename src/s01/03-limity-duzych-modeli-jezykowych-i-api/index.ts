import * as OpenAIService from '../../libs/OpenAIService';
import type { CentralaResponse } from '../../libs/types';

const apiKey = process.env.API_KEY || '';
const taskName = 'JSON';
const fileName = './src/03-limity-duzych-modeli-jezykowych-i-api/json.txt';

const systemPrompt = 'Your job is to answer the following questions based on the data provided. Anwer as short as possible using one word or in case of question about person name use full name.';

// 1. Pobierz plik
const file = Bun.file(fileName);
const fileExist = await file.exists();
if (!fileExist) {
    console.log('📄 pobieranie pliku...');
    const jsonFile = await fetch(`${process.env.CENTRALA_URL}/data/${apiKey}/json.txt`);
    const json = await jsonFile.text();
    await Bun.write(fileName, json);
}

const fixedFile = Bun.file(`${fileName}_fixed.txt`);
const fixedFileExist = await fixedFile.exists();
let json;

if (!fixedFileExist) {
    // 2. Odczytaj plik
    console.log('📄 odczytywanie pliku...');
    const jsonFile = Bun.file(fileName);
    json = await jsonFile.json();

    // 3. Przetwórz plik
    console.log('📄 przetwarzanie pliku...');
    json.apikey = apiKey;
    for (const data of json['test-data']) {
        const calc = data.question;
        data.answer = eval(calc);
        if (data.test) {
            const request = await OpenAIService.askLLM(systemPrompt, data.test.q, 'gpt-4o', true);
            data.test.a = request;
        }
    }

    // 4. Zapisz plik
    console.log('📄 zapisywanie pliku...')
    await Bun.write(`${fileName}_fixed.txt`, JSON.stringify(json));
} else {
    console.log('📄 odczytywanie pliku...');
    json = await fixedFile.json();
}

// 5. Wyslij plik do centrali
console.log('📄 wysyłanie pliku...')
const response: CentralaResponse = {
    task: taskName,
    apikey: apiKey,
    answer: json
}

const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(response)
});
const centralaResponse = await centralaRequest.json();
console.log(centralaResponse);