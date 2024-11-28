import express from 'express';
import * as OpenAIService from '../../libs/OpenAIService';


const startServer = () => {
    const app = express();
    const port = 3000;

    // Middleware
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

    app.get('/', (_, res: any) => {
        res.send('Hello World');
    });

    const processInstruction = async (instruction: string): Promise<{ _thinking: string, STATUS: string, X: number, Y: number }> => {
        const systemPrompt = `Twoim zadaniem jest przesunąć pionek na planszy 4x4 zgodnie z instrukcjami użytkownika. Plansza opisana jest poprzez X oraz Y. Pionek zawsze zaczyna na pozycji X=1 oraz Y=1.
    Granica planszy to X=4 oraz Y=4. Pionek nie może wyjść poza granice planszy.
    
    Odpowiedz w formacie JSON i tylko takim, bez używania markdown. Format odpowiedzi:
    {
        "_thinking": "opisz tutaj sposób obliczenia pozycji X i Y pionka na planszy",
        "STATUS: "status OK/ERROR, w zależności czy pionek nie wychodzi poza planszę",
        "X": "pozycja X",
        "Y": "pozycja Y"
    }

    <przykłady>
    USER: "poleciałem dwa w prawo i trzy w dół"
    AI: { "_thinking": "Pionek zawsze zaczyna na pozycji X=1 oraz Y=1. Dwa w prawo to +2 do X, trzy w dół to +3 do Y. W związku z tym, pionek jest teraz na pozycji X=3 oraz Y=4", "STATUS": "OK", "X": 3, "Y": 4 }

    USER: "poleciałem na maksa w dół"
    AI: { "_thinking": "Pionek zawsze zaczyna na pozycji X=1 oraz Y=1. Plansza ma rozmiar 4x4, więc na maksa w dół to wartość maksymalna Y czyli Y=4. X się nie zmienił, więc X=1", "STATUS": "OK", "X": 1, "Y": 4 }

    USER: "poleciałem na maksa w prawo"
    AI: { "_thinking": "Pionek zawsze zaczyna na pozycji X=1 oraz Y=1. Plansza ma rozmiar 4x4, więc na maksa w prawo to wartość maksymalna X czyli X=4. Y się nie zmienił, więc Y=1", "STATUS": "OK", "X": 4, "Y": 1 }

    USER: "poleciałem na maksa w prawo i w dół"
    AI: { "_thinking": "Pionek zawsze zaczyna na pozycji X=1 oraz Y=1. Plansza ma rozmiar 4x4, więc na maksa w prawo to wartość maksymalna X czyli X=4. W dół to +1 do Y. Pionek jest teraz na pozycji X=4 oraz Y=2", "STATUS": "OK", "X": 4, "Y": 2 }

    USER: "w lewo i do góry"
    AI: { "_thinking": "Pionek zawsze zaczyna na pozycji X=1 oraz Y=1. W lewo to -1 do X, do góry to -1 do Y. Pionek nie może wyjść poza granice planszy, więc X=1 oraz Y=1", "STATUS": "ERROR", "X": 1, "Y": 1 }
    </przykłady>

    Odpowiedz tylko w formacie JSON bez użycia formatu markdown. Powodzenia!
    `;

        const response = <string>await OpenAIService.askLLM(systemPrompt, instruction, 'gpt-4o', true);
        return JSON.parse(response);


    };

    const buildAnswer = (answer: { _thinking: string, STATUS: string, X: number, Y: number }, map: { pos: number[], descr: string }[]): string => {
        return map.find((el) => el.pos[0] === answer.X && el.pos[1] === answer.Y)?.descr || '';
    }


    app.post('/', async (request: express.Request, res: express.Response, next: express.NextFunction) => {


        const { instruction } = request.body;

        const mapa = [
            { pos: [1, 1], descr: "start" },
            { pos: [1, 2], descr: "trawa" },
            { pos: [1, 3], descr: "trawa" },
            { pos: [1, 4], descr: "duże skały" },
            { pos: [2, 1], descr: "trawa" },
            { pos: [2, 2], descr: "młyn" },
            { pos: [2, 3], descr: "trawa" },
            { pos: [2, 4], descr: "duże skały" },
            { pos: [3, 1], descr: "drzewo" },
            { pos: [3, 2], descr: "trawa" },
            { pos: [3, 3], descr: "małe skały" },
            { pos: [3, 4], descr: "samochód" },
            { pos: [4, 1], descr: "dom" },
            { pos: [4, 2], descr: "trawa" },
            { pos: [4, 3], descr: "dwa drzewa" },
            { pos: [4, 4], descr: "jaskinia" }
        ];

        console.log('Instruction:', instruction);

        const answer = await processInstruction(instruction);

        console.log('Answer:', answer._thinking);
        console.log('Status:', answer.STATUS);

        if (answer.STATUS === 'OK') {
            const description = buildAnswer(answer, mapa);
            res.json({ description: description });
        }

        if (answer.STATUS === 'ERROR') {
            res.json({ description: 'Gdzieś ty pilocie poleciał?' });
        }


    });
}

startServer();