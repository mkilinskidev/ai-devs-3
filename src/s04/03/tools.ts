import { JSDOM } from 'jsdom';
import TurndownService from "turndown";
import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';

export const planPrompt = (mainPage: string, visitedSites: string[], siteContent: string): string => {
    const prompt = `Twoim celem jest odpowiedzieć na zadanie użytkownika. W tym celu musisz przeprowadzić analizę strony internetowej, którą załaduję w formacie markdown. Będziesz musiał podjąć decyzję, na którą stronę wejść, aby znaleźć odpowiedź.
    
    <DOSTĘPNE_NARZĘDZIA>
    1. GETSITECONTENT - pobiera zawartość strony internetowej w formacie markdown.
    </DOSTĘPNE_NARZĘDZIA>
    
    W odpowiedzi na akcję dostaniesz zawartość strony internetowej w formacie markdown. Na jej podstawie postaraj się odpowiedzieć na pytanie użytkownika lub zaproponuj przeszukanie kolejnego linka.
    
    <ODWIEDZONE_STRONY>
    ${visitedSites.length > 0 ? visitedSites : 'Brak odwiedzonych stron, zaniczj od strony głównej' }
    </ODWIEDZONE_STRONY>


    <ZASADY>
    1. Nie odwiedzaj ponownie już odwiedzonych stron.
    2. Jeżeli wybrałeś zły kierunek, rozpocznij analizę od strony głównej i nie odwiedzaj ponownie już odwiezonych stron.
    3. Jeżeli jesteś w stanie odpowiedzieć na pytanie użytkownika, udziel zwięzłej i konkretnej odpowiedzi na pytanie w polu 'PARAMS' i jako akcji użyj 'KONIEC'.
    </ZASADY>

    Odpowiedz w czystym formacie JSON:
    {
        "_thinking": "Tutaj wpis swój proces myślowy, dlaczego akurat wybrałeś taką stronę do analizy",
        "ACTION": "wybrana przez ciebie akcja, np. GETSITECONTENT",
        "PARAMS": "parametry akcji, np. adres URL strony lub odpowiedź na pytanie użytkownika",
    }

    <STRONA_GŁÓWNA>
    ${mainPage}
    </STRONA_GŁÓWNA>

    <ZAWARTOŚĆ_STRONY>
    ${siteContent || 'Brak zawartości strony' }
    </ZAWARTOŚĆ_STRONY>

    Odpowiedz w czystym JSON. Nie dodawaj niczego więcej. Nie używaj formatu markdown. Powodzenia!
    `;

    return prompt;
}



export const getQuestions = async (): Promise<{ id: string, question: string }> => {
    const file = await fetch(`${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/softo.json`);
    const data = await file.json();
    return data;
}

export const getSiteContent = async(url: string): Promise<string> => {
    const localFileName = new Bun.CryptoHasher('md5').update(url).digest('hex').toString();
    const localFile = Bun.file(join(__dirname, 'storage', `${localFileName}.md`));
    if (await localFile.exists()) {
        console.log(`[TOOL getSiteContent] Using local cache: ${url}.md`);
        return await localFile.text();
    }

    console.log(`[TOOL getSiteContent] Fetching site content from: ${url}`);
    const extract_body = (html_string: string): string => {
        const dom = new JSDOM(html_string);
        const body_element = dom.window.document.getElementsByTagName("body")[0];
        return body_element.innerHTML;
    }
    const fix_urls = (markdown: string): string => {
        const baseUrl = `${process.env.SOFTO_URL}`;
        return markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, url) => {
            if (!url.startsWith('https')) {
                url = baseUrl + url;
            }
            return `![${altText}](${url})`;
        }).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            if (!url.startsWith('https')) {
                url = baseUrl + url;
            }
            return `[${text}](${url})`;
        });
    }

    const html = await fetch(url);
    const extracted = extract_body(await html.text());

    const cleaned = await OpenAIService.cleanHTML(extracted);

    const turndownService = new TurndownService();
    const markdown = fix_urls(turndownService.turndown(cleaned));
    await Bun.write(join(__dirname, 'storage', `${localFileName}.md`), markdown);

    return markdown;
}
