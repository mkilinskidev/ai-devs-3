import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';
import type { CentralaResponse } from "../../libs/types";

const processFile = async (file: string, facts: string) : Promise<{[key: string]: string}> => {
    const keywordFile = Bun.file(join(__dirname, 'raporty', `${file}.keywords`));
    if (!await keywordFile.exists()) {
        const reportFile = Bun.file(join(__dirname, 'raporty', file));
        const fileData = await reportFile.text();

        const systemPrompt = `Analyze the provided text and extract keywords in their base form (e.g., "robot," not "robots").

Step 1: Analyze the text and facts (enclosed in <facts></facts>) to identify connections. Use the <thinking> tag to outline how elements from the facts are relevant to the text. Focus on the most essential people, objects, places, actions, concepts and skills. Each fact can be correlated with other.
Step 2: Based on the analysis in <thinking>, extract keywords:
* From the text: Include explicitly mentioned or clearly implied keywords.
* From the facts: Include related keywords if the text refers to or aligns with elements described in the facts. Focus on the most essential people, objects, places, actions, concepts, skills, programming languages and technical skills. If somebody is mentioned in the text, include their skills (such a programming languages) and profession in the keyword list.
* Avoid pronouns, conjunctions, or irrelevant words. Exclude names unless explicitly mentioned in the text.
* Include in the keyword list only the most relevant terms that are directly related to the text and connected facts, including programming languages.
* IMPORTANT: Provide the keyword list in Polish language, separated by commas.
* IMPORTANT: From the file name, extract the sector name and add them to the keyword list.

<facts>
${facts}
</facts>

<thinking>  
[Provide a brief reasoning on how the facts connect to the text.]  
</thinking>  

<result>
[keyword list here in Polish language, separated by commas]
</result>`;

        const fullKeywords = <string>await OpenAIService.askLLM(systemPrompt, `Prepare keyword list form text and facts. FileName: ${file} Text:\n${fileData}`, 'gpt-4o', true);
        await Bun.write(join(__dirname, 'raporty', `${file}.thinking`), fullKeywords);
        const keywords = fullKeywords.split('<result>')[1].split('</result>')[0].trim();
        await Bun.write(join(__dirname, 'raporty', `${file}.keywords`), keywords);
    }
    const fileData = await keywordFile.text();
    

    // const

    return { [file]: fileData };
}

const processReports = async (facts: string) : Promise<{[key: string]: string}> => {
    const files = await readdir(join(__dirname, 'raporty'));
    const txtFiles = files.filter(file => file.endsWith('.txt'));
    const reportArray = await Promise.all(txtFiles.map(file => processFile(file, facts)));
    const report = reportArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    return report;
}

const processFacts = async (): Promise<string> => {
    const files = await readdir(join(__dirname, 'raporty', 'facts'));
    let facts = '';
    for (const file of files) {
        const fileFile = Bun.file(join(__dirname, 'raporty', 'facts', file));
        const fileData = await fileFile.text();
        if (fileData.trim() != 'entry deleted') {
            facts += `${fileData.trim()}\n========\n`;
        }
    }

    return facts;
}


const main = async () => {
    const facts = await processFacts();
    const report = await processReports(facts);
    
    const centralaResponse = {
        task: 'dokumenty',
        apikey: process.env.API_KEY || '',
        answer: report
    }

    const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(centralaResponse)
    });

    console.log('Response from Centrala:', await centralaRequest.json());
} 

await main().catch(console.error);