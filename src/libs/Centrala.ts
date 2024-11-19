import type { CentralaResponse } from './types';

export default class Centrala {
    private request: CentralaResponse;

    constructor(taskName: string, answer: any) {
        this.request = {
            task: taskName,
            apikey: process.env.API_KEY || '',
            answer: answer
        }
    }

    async sendReport() {
        const centralaRequest = await fetch(`${process.env.CENTRALA_URL}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.request)
        });

        return await centralaRequest.json();
    }
}


// export default function centralaRequest(taskName: string, answer: any): CentralaResponse {
//     return {
//         task: taskName,
//         apikey: process.env.API_KEY || '',
//         answer: answer
//     }
// }