import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';
import Centrala from '../../libs/Centrala';


const getFile = async (filename: string) => {
    const dataFile = Bun.file(join(__dirname, 'storage', filename));
    if (! await dataFile.exists()) {
        const data = await (await fetch(`${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/${filename}`)).json();
        await Bun.write(join(__dirname, 'storage', filename), JSON.stringify(data));
    }

    return await dataFile.json();
}

const whoIsTalking = async (data: any): Promise<string> => {
    const whoFile = Bun.file(join(__dirname, 'storage', 'who.json'));
    if (! await whoFile.exists()) {
        const systemPrompt = `Na podstawie dostarczonych transkrypcji rozmów telefonicznych odpowiedz, kto z kim rozmawia w każdej rozmowie. Jeżeli w rozmowie pojawia się kobieta, jest to Barbara. Rozmowy mogą być kontynuacją poprzednich rozmów i mogą do nich nawiązywać.
        Odpowiedz w formacie JSON bez dodatkowych tagów markdown:
        {
            "rozmowa1": "Imię osoby 1 z Imię osoby 2",
            "rozmowa2": "Imię osoby 1 z Imię osoby 2",
            ...
        }
            
        Transkrypcja rozmów:
        ${JSON.stringify(data)}`;

        const who = <string>await OpenAIService.askLLM(systemPrompt, 'Określ, kto z kim rozmawia.', 'gpt-4o', true);
        await Bun.write(join(__dirname, 'storage', 'who.json'), who);
    }

    return await whoFile.text();
}


const main = async () => {
    const data = await getFile('phone_sorted.json');
    const questions = await getFile('phone_questions.json');

    // const who = await whoIsTalking(data);

    const answers = await getFile('answers.json');
    const centrala = new Centrala('phone', answers);
    const response = await centrala.sendReport();
    console.log(response);
}


await main().catch(console.error);