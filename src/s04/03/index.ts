import * as tools from './tools';
import * as OpenAIService from '../../libs/OpenAIService';
import Centrala from '../../libs/Centrala';
import { join } from 'path';

interface IAction {
    _thinking: string;
    ACTION: string;
    PARAMS: string;
}

const plan = async (question: string, visitedSites: string[], siteContent: string): Promise<IAction> => {
    const systemPrompt = tools.planPrompt(`${process.env.SOFTO_URL}`, visitedSites, siteContent);
    const action = <string>await OpenAIService.askLLM(systemPrompt, question, 'gpt-4o', true);
    const actionJSON = JSON.parse(action) as IAction;
    console.log('AI:', actionJSON._thinking, actionJSON.ACTION, actionJSON.PARAMS);
    return actionJSON;
}

const doAction = async (action: string, params: string): Promise<string> => {
    switch (action) {
        case 'GETSITECONTENT':
            const siteContent = await tools.getSiteContent(params);
            return siteContent;
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

const answerFile = Bun.file(join(__dirname, 'answers.json'));
if (! await answerFile.exists()) {

    const _questions = await tools.getQuestions();
    const questions = Object.values(_questions);

    const answers: string[] = [];

    for (const key in questions) {
        const q = questions[key];

        let visitedSites: string[] = [];
        let siteContent = '';

        while (true) {
            const action = await plan(q, visitedSites, siteContent);

            if (action.ACTION === 'KONIEC') {
                answers.push(action.PARAMS);
                break;
            }

            siteContent = await doAction(action.ACTION, action.PARAMS);
            visitedSites.push(action.PARAMS);
        }
    }

    const answer = {
        "01": answers[0],
        "02": answers[1],
        "03": answers[2],
    }

    await Bun.write(join(__dirname, 'answers.json'), JSON.stringify(answer));
}

const answer = await answerFile.json();

const centrala = new Centrala('softo', answer);
const result = await centrala.sendReport();
console.log(result.message);




