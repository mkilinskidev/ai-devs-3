import * as neo4j from "neo4j-driver";

export default class Neo4jService {
    private driver: neo4j.Driver;

    constructor(uri: string, user: string, password: string) {
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }

    async createUsers(users: Array<{ username: string; id: number }>): Promise<void> {
        const session = this.driver.session();
        try {
            await session.executeWrite(async (tx) => {
                let i = 0;
                for (const user of users) {
                    i++;
                    console.log('Processing', i, 'of', users.length, ':', user.username);
                    const query = `CREATE (:User {name: $name, no: $id})`;
                    const params = { name: user.username, id: user.id };
                    await tx.run(query, params);
                }
            });
        } finally {
            await session.close();
        }
    }

    async createRelationships(relationships: Array<{ user1_id: number; user2_id: number }>): Promise<void> {
        const session = this.driver.session();
        try {
            await session.executeWrite(async (tx) => {
                let i = 0;
                for (const relationship of relationships) {
                    i++;
                    console.log('Processing', i, 'of', relationships.length, ':', relationship.user1_id, '->', relationship.user2_id);
                    const query = `
                        MATCH (a:User {no: $user1_id})
                        MATCH (b:User {no: $user2_id})
                        CREATE (a)-[:KNOWS]->(b)
                    `;
                    const params = { user1_id: relationship.user1_id, user2_id: relationship.user2_id };
                    if (relationship.user1_id !== relationship.user2_id) {
                        await tx.run(query, params);
                    }
                }
            });
        } finally {
            await session.close();
        }
    }

    async processQuery(from: string, to: string): Promise<string> {
        const session = this.driver.session();
        let result = '';
        try {
            await session.executeRead(async (tx) => {
                const query = `
                    MATCH p=shortestPath(
                        (from:User {name:$from})-[*]-(to:User {name:$to})
                    )
                    RETURN p
                `;
                const params = { from: from, to: to };
                const response = (await tx.run(query, params)).records[0];
                if (response) {
                    const nodes = response.get('p').segments.flatMap((segment: any) => [segment.start, segment.end]);
                    const uniqueNodes = Array.from(new Set(nodes.map((node: any) => node.properties.name)));
                    result = uniqueNodes.join(', ');
                }
            });
        } finally {
            await session.close();
        }

        return result;
    }

    async close(): Promise<void> {
        await this.driver.close(); // Zamykamy połączenie
    }
}
