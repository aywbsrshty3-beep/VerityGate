import { Client } from 'pg';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';

async function openConnection(): Promise<Client> {
    const client = new Client({
        connectionString: connectionString,
    });
    await client.connect();
    return client;
}

async function selectData(client: Client, tableName: string): Promise<any[]> {
    const res = await client.query(`SELECT * FROM ${tableName}`);
    return res.rows;
}

async function insertData(client: Client, tableName: string, data: any): Promise<void> {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`;
    await client.query(query, values);
}

async function main() {
    const client = await openConnection();
    try {
        const ORG_ID = "EVIL-ORG";

        // const tableName = 'hephaestus.organization';
        // const corp = {id: ORG_ID, name:ORG_ID, enabled:true}
        // const dataToInsert = { id: ORG_ID, payload: JSON.stringify(corp) };
        // await insertData(client, tableName, dataToInsert);

        // const tableName = 'hephaestus.actor';
        // const actor = { id: "SISSY", name: "Sissy Maker", role: "MAKER", orgId: ORG_ID, enabled: true }
        // const dataToInsert = { id: 'SISSY', payload: JSON.stringify(actor) };
        // await insertData(client, tableName, dataToInsert);
        
        const tn = 'hephaestus.policy';
        const p =  {"id":"WP-2","name":"Wish Creation Policy","orgId": ORG_ID,"subOrgApplicability":false,"wishKind":"WISH_CREATION","ruleIds":["WPR-1"],"controls":{},"enabled":true,"dynamic":false,"validFor":1.7976931348623157e+308}
        const dataToInsert = { id: 'WP-2', payload: JSON.stringify(p) };
        await insertData(client, tn, dataToInsert);

        // const tn = 'hephaestus.policyrule';
        // const p = {"id":"WPR-1","name":"Wish Creation Rule","enabled":true,"expression":"ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === 'MAKER'"}
        // const dataToInsert = { id: 'WPR-1', payload: JSON.stringify(p) };
        // await insertData(client, tn, dataToInsert);

        // const tn = 'hephaestus.policycontrol';
        // const p = {
        //     id: 'CREATE-POL-CONTROL-1',
        //     name: 'Create Policy Control',
        //     config: {
        //       roles: [ 'CHECKER' ],
        //       orgs: [ 'LUMA-ORG' ],
        //       minApprover: 1,
        //       timeoutInSeconds: 3600
        //     }
        // }
        // const dataToInsert = { id: 'CREATE-POL-CONTROL-1', payload: JSON.stringify(p) };
        // await insertData(client, tn, dataToInsert);

        // const tn = 'hephaestus.policyrule';
        // const p = { id: 'CREATE-POL-RULE-1', name: 'Create Policy Rule', enabled: true }
        // const dataToInsert = { id: 'CREATE-POL-RULE-1', payload: JSON.stringify(p) };
        // await insertData(client, tn, dataToInsert);

        // const tn = 'hephaestus.policy';
        // const p =  {"id":"CREATE-POL-1","name":"Create Policy Policy","orgId":"LUMA-ORG","subOrgApplicability":false,"wishKind":"CREATE_POLICY","ruleIds":["CREATE-POL-RULE-1"],"controls":{"CREATE-POL-RULE-1":"CREATE-POL-CONTROL-1"},"enabled":true,"dynamic":false,"validFor":1.7976931348623157e+308}       
        // const dataToInsert = { id: 'CREATE-POL-1', payload: p };
        // await insertData(client, tn, dataToInsert);
    } finally {
        await client.end();
    }
}

main().catch(err => console.error('Error executing query', err.stack));