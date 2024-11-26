import { sys } from "typescript";
import Centrala from "../../libs/Centrala";
import * as OpenAIService from "../../libs/OpenAIService";
import { extractImagesPrompt } from "./prompts/extractImages";
import { planPrompt } from "./prompts/planPrompt";
import { analyzeFile } from "./imageAnalyze";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

interface IAction {
    _thinking: string;
    ACTION: string;
    PARAMS: string;
}

const extractImagesURLs = async (message: string): Promise<{status: string, images: string[]}> => {
    const systemPrompt = extractImagesPrompt();
    const images = <string>await OpenAIService.askLLM(systemPrompt, message, 'gpt-4o-mini', true);
    const imagesJSON = JSON.parse(images) as {status: string, images: string[]};
    return imagesJSON;
}

const plan = async(message: string): Promise<IAction> => {
    const systemPrompt = planPrompt(lastAction, lastResult, {processingImage: lastParams, usedTools: usedTools });
    // console.log('AI system prompt:', systemPrompt);
    const action = <string>await OpenAIService.askLLM(systemPrompt, message, 'gpt-4o', true);
    // console.log('AI action response:', action);
    const actionJSON = JSON.parse(action) as IAction;
    console.log('AI:', actionJSON._thinking);
    return actionJSON;
}

const doAction = async(action: string, params: string): Promise<string> => {
    
    switch(action) {
        case 'START':
            console.log('\tInvoke action START', params);
            const givePhotos = new Centrala('photos', 'START');
            const photos = await givePhotos.sendReport();
            return photos.message;
        case 'EXTRACTION':
            console.log('\tInvoke action EXTRACTION', params);
            const giveText = new Centrala('text', 'START');
            const text = await giveText.sendReport();
            const images = await extractImagesURLs(text.message);
            return images.images.join(', ');
        case 'ANALYZE':
            const result = await analyzeFile(params);
            console.log('\tInvoke action ANALYZE', params, 'RESULT:', result);
            return result;
        case 'REPAIR':
            if (!params) {
                throw new Error('No image to repair');
            }
            const repairPhoto = new Centrala('photos', `REPAIR ${params}`);
            const repairedPhoto = await repairPhoto.sendReport();
            console.log('\tInvoke action REPAIR', params, 'RESULT:', repairedPhoto.message);
            return repairedPhoto.message;
        case 'DARKEN':
            if (!params) {
                throw new Error('No image to darken');
            }
            const darkenPhoto = new Centrala('photos', `DARKEN ${params}`);
            const darkenedPhoto = await darkenPhoto.sendReport();
            console.log('\tInvoke action DARKEN', params, 'RESULT:', darkenedPhoto.message);
            return darkenedPhoto.message;
        case 'BRIGHTEN':
            if (!params) {
                throw new Error('No image to brighten');
            }
            const brightenPhoto = new Centrala('photos', `BRIGHTEN ${params}`);
            const brightenedPhoto = await brightenPhoto.sendReport();
            console.log('\tInvoke action BRIGHTEN', params, 'RESULT:', brightenedPhoto.message);
            return brightenedPhoto.message;
        default:
            throw new Error(`Unknown action ${action}`);
    }
}


let lastAction = '';
let lastResult = '';
let lastParams = '';
const job = 'Przygotuj rysopis Barbary w języku polskim. Uwzględnij wszystkie szczegóły ze zdjęć, które pomogą mi ją rozpoznać';

const result = await doAction('START', '');
const images = await extractImagesURLs(result);

// const images: {status: string, images: string[]} = {
//     status: 'OK',
//     images: ['https://centrala.ag3nts.org/dane/barbara/IMG_1443.PNG']
// }

let usedTools = '';
let finished = false;
for (const image of images.images) {
    console.log('Processing image:', image);
    lastAction = '';
    lastResult = '';
    lastParams = '';
    usedTools = '';
    let i = 0;
    while (true) {
        lastParams = image;
        const action = await plan(job);
        if (action.ACTION === 'PORAŻKA') {
            break;
        }

        if (action.ACTION === 'KONIEC') {
            finished = true;
            break;
        }

        const result = await doAction(action.ACTION, action.PARAMS);
    
        lastAction = action.ACTION;
        lastParams = action.PARAMS;
        lastResult = result;
        i++;
        usedTools += `${i}. ${action.ACTION} ${action.PARAMS}\n`;
    
        
    }
    console.log(`\n\n`);
    if (finished) {
        break;
    }
}


console.log('Koniec zadania');
console.log(lastResult);

const centrala = new Centrala('photos', lastResult);
const response = await centrala.sendReport();
console.log(response);


// TESTS:
// const action = await doAction('DARKEN', 'IMG_559_FGR4.PNG');
// console.log(action);
