import OpenAI from "openai";
import { join } from "path";

class BarbaraAgent {
    private openAI: OpenAI;
    private visitedCities: Set<string> = new Set();
    private visitedPeople: Set<string> = new Set();

    constructor(openAI: OpenAI) {
        this.openAI = openAI;
    }

    // Funkcja generująca prompt na podstawie dostępnych informacji
    private async generatePrompt(personName: string, cities: string[], knownPeople: string[]): Promise<string> {
        const systemPrompt = `
        Jesteś agentem AI, który analizuje dane i pomaga znaleźć odpowiedzi na pytania. 
        Masz do dyspozycji listę osób i miast, które mogą pomóc w znalezieniu osoby Barbara.
      `;

        const userPrompt = `
        Z danych wynika, że w notatce o Barbara pojawiły się osoby: ${knownPeople.join(", ")} oraz miasta: ${cities.join(", ")}.
        Twoim zadaniem jest iteracyjne zapytanie o te miasta i osoby w celu znalezienia miejsca, w którym przebywa Barbara.
      `;

        return systemPrompt + "\n" + userPrompt;
    }

    // Funkcja do zadawania pytań do OpenAI
    private async askOpenAI(prompt: string): Promise<string> {
        const response = await this.openAI.chat.completions.create({
            model: "gpt-4o", // Możesz użyć GPT-3.5, jeśli to wystarczające
            messages: [{ role: "system", content: prompt }],
        });
        return response.choices[0]?.message?.content || "Brak odpowiedzi";
    }

    // Funkcja do wysyłania raportu do centrali
    private async reportCity(city: string) {
        console.log(`Wysłano raport do centrali: ${city}`);
        // Tutaj wyślij odpowiednią nazwę miasta do API lub innej centrali
    }

    // Główna funkcja, która wykonuje iteracyjne zapytania o miasta i osoby
    async findBarbaraCity(personName: string, getCitiesForPerson: (personName: string) => Promise<string[]>, getPeopleInCity: (city: string) => Promise<string[]>): Promise<void> {
        let cities = await getCitiesForPerson(personName);

        // Iterujemy przez wszystkie miasta i szukamy Barbary
        while (cities.length > 0) {
            // Jeśli miasto już było odwiedzone, pominij je
            const city = cities.shift();
            if (city && this.visitedCities.has(city)) continue;

            this.visitedCities.add(city);

            // Zapytaj o ludzi w tym mieście
            const peopleInCity = await getPeopleInCity(city);

            // Jeśli Barbara jest w tym mieście, wysyłamy raport
            if (peopleInCity.includes('BARBARA')) {
                await this.reportCity(city);
                return;  // Zakończenie procesu
            }

            // Dodajemy nowych ludzi do listy osób do sprawdzenia
            for (const person of peopleInCity) {
                if (!this.visitedPeople.has(person)) {
                    this.visitedPeople.add(person);
                    // Jeśli osoba nie była sprawdzana, dodajemy jej miasta
                    const newCities = await getCitiesForPerson(person);
                    cities = [...newCities, ...cities];
                }
            }
        }

        console.log("Nie znaleziono Barbary w żadnym z miast.");
    }
}

const cleanLetters = (text: string): string => {
    const polishChars: { [key: string]: string } = {
        'ą': 'a', 'Ą': 'A',
        'ć': 'c', 'Ć': 'C',
        'ę': 'e', 'Ę': 'E',
        'ł': 'l', 'Ł': 'L',
        'ń': 'n', 'Ń': 'N',
        'ó': 'o', 'Ó': 'O',
        'ś': 's', 'Ś': 'S',
        'ź': 'z', 'Ź': 'Z',
        'ż': 'z', 'Ż': 'Z'
    };

    // Replace each Polish character with its non-diacritical equivalent
    return text.replace(/[ąĄćĆęĘłŁńŃóÓśŚźŹżŻ]/g, char => polishChars[char] || char);
}

// Mockowe API, które będzie używane w przykładzie
const getCitiesForPerson = async (personName: string) => {
    const request = {
        apikey: process.env.API_KEY || '',
        query: personName
    }
    const response = await fetch(`${process.env.CENTRALA_URL}/people`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    let cities = (await response.json()).message;
    const regex = /\[\*\*RESTRICTED DATA\*\*\]/g;
    cities = cities.replace(regex, '');
    cities = cleanLetters(cities);
    const citiesArray = cities.split(' ');
    return citiesArray.filter((city: string) => city !== '');
};

const getPeopleInCity = async (city: string) => {
    const request = {
        apikey: process.env.API_KEY || '',
        query: city
    }
    const response = await fetch(`${process.env.CENTRALA_URL}/places`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    let people = (await response.json()).message;
    const regex = /\[\*\*RESTRICTED DATA\*\*\]/g;
    people = people.replace(regex, '');
    people = cleanLetters(people);
    const peopleArray = people.split(' ');
    return peopleArray.filter((person: string) => person !== '');
};

const getInitialNames = async (): Promise<string[]> => {
    const file = Bun.file(join(__dirname, 'storage', 'names.txt'));
    const names = await file.text();
    return names.split(',').map(name => name.trim().toUpperCase());
}

// Użycie agenta
async function main() {
    const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const agent = new BarbaraAgent(openAI);

    const names = await getInitialNames();
    for (const personName of names) {
        await agent.findBarbaraCity(personName, getCitiesForPerson, getPeopleInCity);
    }
}

main();
