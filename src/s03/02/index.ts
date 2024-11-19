import { readdir } from 'fs/promises';
import { join } from 'path';
import * as OpenAIService from '../../libs/OpenAIService';
import { randomUUIDv7 } from 'bun';
import { QdrantClient } from '@qdrant/js-client-rest';
import Centrala from '../../libs/Centrala';

const collectionName = 'wektory';

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

interface MetaData {
    text: string,
    report_date: string,
    keywords: string[],
}

const getFileKeywords = async (filename: string, text: string): Promise<string[]> => {
    const bunFile = Bun.file(join(__dirname, 'dane', `${filename}.keywords`));
    if (await bunFile.exists()) {
        return (await bunFile.text()).split(',').map(keyword => keyword.trim());
    }

    const systemPrompt = `Analyze the provided text and extract keywords in their base form (e.g., "robot," not "robots"). Include explicitly mentioned or clearly implied keywords. Return the keyword list in Polish language, separated by commas and nothing else.`;
    const keywords = <string>await OpenAIService.askLLM(systemPrompt, `Prepare keyword list form text. Text:\n${text}`, 'gpt-4o-mini', true);
    await Bun.write(bunFile, keywords);
    return keywords.split(',').map(keyword => keyword.trim());
}

const initCollection = async (collectionName: string): Promise<boolean> => {
    const collections = await qdrant.getCollections();
    if (!collections.collections.some(c => c.name === collectionName)) {
        return await qdrant.createCollection(collectionName, {
            vectors: { size: 1024, distance: 'Cosine' }
        });
    }
    return false;
}

const initData = async () => {
    const files = await readdir(join(__dirname, 'dane'));
    const data = await Promise.all(files.filter(f => f.endsWith('txt')).map(async (file: string): Promise<MetaData> => {
        const bunFile = Bun.file(join(__dirname, 'dane', file));
        const content = await bunFile.text();
        const keywords = await getFileKeywords(file, content);

        return { text: content, report_date: file.split('.')[0].replaceAll('_', '-'), keywords: keywords };
    }));


    if (await initCollection(collectionName)) {
        const pointsToUpsert = await Promise.all(data.map(async data => {
            const embedding = await OpenAIService.createJinaEmbedding(data.text);

            return {
                id: randomUUIDv7(),
                vector: embedding,
                payload: {
                    ...data
                }
            }
        }));

        await qdrant.upsert(collectionName, {
            wait: true,
            points: pointsToUpsert
        });
    }
}




const main = async () => {
    await initData();

    const query = 'Kradzież prototypu broni';
    const embedding = await OpenAIService.createJinaEmbedding(query);
    const response = await qdrant.search(collectionName, {
        vector: embedding,
        limit: 1,
        with_payload: true
    });

    const centralaRequest = new Centrala(collectionName, response[0].payload?.report_date);
    const centralaResponse = await centralaRequest.sendReport();
    console.log('Response from Centrala:', centralaResponse);

}

await main().catch(console.error);