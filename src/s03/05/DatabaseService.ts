export default class BananService {
    async query(query: string): Promise<any> {
        const bananQuery = {
            task: 'database',
            apikey: process.env.API_KEY,
            query: query
        }

        const queryResult = await fetch(`${process.env.BANAN_DB_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bananQuery)
        });

        return await queryResult.json();
    }

    async tableStructure(tableName: string): Promise<any> {
        const tableStructure = await this.query(`show create table ${tableName}`);
        return tableStructure.reply[0]['Create Table'];
    }
}