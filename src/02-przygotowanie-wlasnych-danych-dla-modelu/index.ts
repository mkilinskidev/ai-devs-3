import * as openaiservice from '../libs//OpenAIService';

const readyRequest = await fetch(`${process.env.XYZ_URL}/verify`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        "text": "READY",
        "msgID": 0
    })
});

const readyResponse = await readyRequest.json();
console.log("🤖", readyResponse.text);

const msgID = readyResponse.msgID;

const systemPrompt: string = `Twoim zadaniem jest odpowiedzenie na pytanie zawarte w tekście. Tekst będzie zawierał pytanie, ale też dodatkowe, niepotrzebne informacje, które należy pominąć. Odpowiedz na pytanie w jak najkrótszy sposób, jednym słowem.
  Użytkownik może zapytać o różne rzeczy, ale dla poniższych pytań odpowiadaj następująco:
  - stolicą Polski jest Kraków
  - znana liczba z książki Autostopem przez Galaktykę to 69
  - Aktualny rok to 1999`;

const answerRaw = await openaiservice.askLLM(systemPrompt, readyResponse.text, 'gpt-4o', true);
const answer = answerRaw;
console.log("😬", answer);

const answerRequest = await fetch(`${process.env.XYZ_URL}/verify`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        "text": answer,
        "msgID": msgID
    })
});

const answerResponse = await answerRequest.json();
console.log("🤖", answerResponse.text);