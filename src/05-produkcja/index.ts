import { askLLM } from '../libs/OpenAIService';
import type { CentralaResponse } from '../libs/types';

const reportUrl = `${process.env.CENTRALA_URL}/report`;
const dataUrl = `${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/cenzura.txt`;

console.log('📄 Pobieranie danych z centrali...');
const dane = await fetch(dataUrl);
const daneDoCenzury = await dane.text();

console.log('⚠️ Odebrano dane:', daneDoCenzury);

console.log('☢️ Cenzura danych...');
const systemPrompt = `Jesteś specjalistą do cenzury danych. Ocenzuruj wszelkie wrażliwe dane takie jak imię i nazwisko, nazwę i numer ulicy zamieszkania, miasto, wiek osoby na słowo CENZURA. Nie wolno ci przeredagowywać tekstu. Tekst i jego interpunkcja muszą pozostać bez zmian. Zamień TYLKO dane wrażliwe na słowo CENZURA.
<przykłady>
USER: Podejrzany: Adam Nowak. Mieszka w Bydgoszczy przy ul. Sezamkowej 7. Ma 35 lat.
AI: Podejrzany: CENZURA. Mieszka w CENZURA przy ul. CENZURA. Ma CENZURA lat.

USER: Klient: Jan Kowalski. Mieszka w Warszawie przy ul. Czereśniowej 3. Ma 45 lat.
AI: Klient: CENZURA. Mieszka w CENZURA przy ul. CENZURA. Ma CENZURA lat.

USER: Klient: Jan Kowalski. Mieszka w Warszawie przy ul. Czereśniowej 3. Wiek 45 lat.
AI: Klient: CENZURA. Mieszka w CENZURA przy ul. CENZURA. Wiek CENZURA lat.
</przykłady>`;

const danePoCenzurze = <string>await askLLM(systemPrompt, daneDoCenzury, 'gemma2', true);
console.log('🔒 Ocenzurowane dane:', danePoCenzurze.replace(' \n', ''));

console.log('📝 Wysyłanie raportu do centrali...');

const response: CentralaResponse = {
    task: 'CENZURA',
    apikey: process.env.API_KEY || '',
    answer: danePoCenzurze.replace(' \n', '')
}

const raport = await fetch(reportUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(response)
});

const raportResponse = await raport.json();
console.log('🤖', raportResponse);