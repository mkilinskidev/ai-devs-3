import { join } from 'path';
import { readdir } from 'fs/promises';
import * as OpenAIService from '../../libs/OpenAIService';
import Centrala from '../../libs/Centrala';
import pdf from 'pdf-parse';
import * as pdf2im from 'pdf2image'; // You need to install this library
import { createWorker } from 'tesseract.js';

const downloadFile = async (fileName: string, url: string) => {
    const noteFile = Bun.file(join(__dirname, 'storage', fileName));
    if (! await noteFile.exists()) {
        const file = await fetch(url);
        if (fileName.endsWith('.json')) {
            await Bun.write(join(__dirname, 'storage', fileName), JSON.stringify(await file.json()));
        } else {
            await Bun.write(join(__dirname, 'storage', fileName), await file.arrayBuffer());
        }
        console.log(`📄 file ${fileName} saved`);
    } else {
        console.log(`📄 file ${fileName} already exists`);
    }
};

const convertPdfToText = async (filePath: string) => {
    const pdfArrayBuffer = await Bun.file(filePath).arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const data = await pdf(pdfBuffer);
    const dataArray = data.text.split('\n\n');
    const pageNum = data.numpages;

    let text = '';
    
    for (let i = 1; i <= pageNum; i++) {
        const file = Bun.file(join(__dirname, 'storage', 'pages', `page-${i}.txt`));
        if (! await file.exists()) {
            await Bun.write(join(__dirname, 'storage', 'pages', `page-${i}.txt`), dataArray[i]);
        }
        const data = await file.text();
        text += data + '\n\n';
    }

    return text;
};

const convertPdfToImages = async (filePath: string) => {
    const images = await pdf2im.convertPDF(filePath, { outputType: 'png' });
    return images;
};

const describeImages = async () => {
    const imagesFolder = join(__dirname, 'storage', 'images');
    const images = await readdir(imagesFolder);

    for (const image of images) {
        const imagePath = join(imagesFolder, image);
        const file = Bun.file(imagePath);
        const fileData = await file.arrayBuffer();
        const fileBase64 = Buffer.from(fileData).toString('base64');

        const imageDescription = await OpenAIService.processOllamaImage(imagePath, 'Jesteś specjalistą OCR. Wyodrębnij ze zdjęcia tekst oraz opisz znajdujące się na nim obrazki. Pomiń wszelkie defekty, takie jak plamy i inne. Udziel odpowiedzi w formacie: Tekst: "..." Obrazek: "..."');
        console.log(`🖼️ Image: ${image} Description: ${imageDescription}`);

        break;
    }
};

const teseractImage = async (imagePath: string): Promise<Tesseract.RecognizeResult> => {
    const worker = await createWorker('pol');
    const ret = await worker.recognize(imagePath);
    const data = ret;
    await worker.terminate();

    return data;
};

const main = async () => {
    const pdfFilePath = join(__dirname, 'storage', 'note.pdf');

    await downloadFile('note.pdf', `${process.env.CENTRALA_URL}/dane/notatnik-rafala.pdf`);
    await downloadFile('questions.json', `${process.env.CENTRALA_URL}/data/${process.env.API_KEY}/notes.json`);

    const questions = await Bun.file(join(__dirname, 'storage', 'questions.json')).json();
    // console.log('Questions:', questions);

    // await describeImages();

    const text = await convertPdfToText(pdfFilePath);


    const teseract = await teseractImage(join(__dirname, 'storage', 'images', 'note_page-0001.jpg'));
    console.log('Tesseract:', teseract.data.text);



    const systemPrompt = `Na podstawie tekstu z notatnika odpowiedz na pytania. Jeżeli trzeba, sięgnij do wiedzy ogólnej. Połącz ze sobą fakty. Zwróć uwagę na styl wypowiedzi. Odpowiedz formie JSON o strukturze takiej, jak w pytaniu. Jeśli nie znasz odpowiedzi na pytanie, odpowiedz 'NIE WIEM'.
    <NOTATNIK>
    ${text}
    </NOTATNIK>
    <PYTANIA>
    ${JSON.stringify(questions)}
    </PYTANIA>
    
    Odpowiedz na pytania korzystając z informacji w notatce i swojej wiedzy ogólnej. W notatce nie ma bezpośredniej informacji, do którego roku przeniósł się Rafał. Z notatki musisz wybrać fakty, które mogą na to wskazywać.`;

    // const answer = <string>await OpenAIService.askLLM(systemPrompt, 'Odpowiedz na pytania.', 'gpt-4o', true);
    // await Bun.write(join(__dirname, 'storage', 'answer.json'), answer);

    // const answer = await Bun.file(join(__dirname, 'storage', 'answer.json')).json();

    // console.log('Answer:', answer);


    // const images = await convertPdfToImages(pdfFilePath);
    // console.log('Extracted Images:', images);




    // const answer = '';
    // const centrala = new Centrala('notes', answer);
    // const response = await centrala.sendReport();
    // console.log(response);
};

await main().catch(console.error);