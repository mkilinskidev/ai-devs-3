import BananService from "./DatabaseService";
import * as OpenAIService from '../../libs/OpenAIService';
import Centrala from "../../libs/Centrala";

const bananService = new BananService();
const userTableStructure = await bananService.tableStructure('users');
const datacenterTableStructure = await bananService.tableStructure('datacenters');

// Misja poboczna
// const dataToSort = (await bananService.query('select * from correct_order')).reply;
// const sortedData = <[]>dataToSort.sort((a: any, b: any) => a.weight - b.weight);
// console.log(sortedData.map((el: any) => el.letter).join(''));


const systemPrompt = `Na podstawie struktury poniższych tabel przygotuj polecenie SQL SELECT, które zwróci id wszystkich datacenterów, których menadżerowie nie są aktywni. Zwróć tylko polecenie SELECT w formacie JSON {"query": "Polecenie SELECT"}.
<table name="users">
    <structure>${userTableStructure}</structure>
</table>
<table name="datacenters">
    <structure>${datacenterTableStructure}</structure>
</table>`;

const userPrompt = `Przygotuj polecenie SELECT, które zwróci id wszystkich datacenterów, których menadżerowie nie są aktywni.`;
const result = <string>await OpenAIService.askLLM(systemPrompt, userPrompt, 'gpt-4o', true);
const query = JSON.parse(result).query;

const queryResult = await bananService.query(query);
const datacenterIds = queryResult.reply.map((dc: any) => dc.dc_id);

const centrala = new Centrala('database', datacenterIds);
const centralaReply = await centrala.sendReport();
console.log(centralaReply);