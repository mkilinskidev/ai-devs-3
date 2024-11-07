const xyz = await fetch(`${process.env.XYZ_URL}/`);
const scrappedXyz = await xyz.text();

let question: string = '';

for (const line of scrappedXyz.split('\n')) {
    if (line.includes('human-question')) {
        question = line.split('human-question">Question:<br />')[1].split('</p>')[0];
        
    }
}

if (question === '') {
    throw new Error('No question found');
}

const chat = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        messages: [
            {
                content: `Answer to the question only with number, nothing else: ${question}`,
                role: 'user'
            }
        ]
    }),
})

const chatResponse = await chat.json();
const answer = chatResponse.choices[0].message.content;
console.log(answer);

const body = new URLSearchParams({
    username: 'tester',
    password: '574e112a',
    answer: answer,
});

const request = await fetch(`${process.env.XYZ_URL}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
});

const response = await request.text();
console.log(response);
