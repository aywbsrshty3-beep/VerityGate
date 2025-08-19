import { Client } from 'pg';
import {Organisation, Actor, Policy, PolicyRule, PolicyControl, Wallet} from './HephaestusTypes';

const connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';

export async function openConnection(): Promise<Client> {
    const client = new Client({
        connectionString: connectionString,
    });
    await client.connect();
    return client;
}

export async function insertData(client: Client, tableName: string, data: any): Promise<void> {
    // console.log("insertData", tableName, data);
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`;
    await client.query(query, values);
}

export async function updateData(client: Client, tableName: string, data: any, id: string): Promise<void> {
    // console.log("updateData", tableName, data, id);
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const query = `UPDATE ${tableName} SET ${setClause} WHERE settlementId = $${keys.length + 1}`;
    await client.query(query, [...values, id]);
}

export async function selectOrgData(client: Client, orgId: string): Promise<Organisation> {
    // console.log("selectOrgData", orgId);
    const res = await client.query(`select payload from Hephaestus.organization where id = '${orgId}';`);
    // console.log("res", res.rows[0].payload);
    return res.rows[0].payload;
}

export async function selectLinkedOrgs(client: Client, orgId: string): Promise<string[]> {
    const res = await client.query(`select linkedid from Hephaestus.linkedorgs where id = '${orgId}';`);
    return res.rows.map((row: any) => row.linkedid);
}

export async function selectActorData(client: Client, actorId: string): Promise<Actor> {
    // console.log("selectActorData", actorId);
    const res = await client.query(`select payload from Hephaestus.actor where id = '${actorId}';`);
    // console.log("res", res.rows[0].payload);
    return res.rows[0].payload;
}

export async function selectAllActors(client: Client, orgId: string): Promise<Actor[]> {
    // console.log("selectAllActors", orgId);
    const res = await client.query(`select payload from Hephaestus.actor where payload->>'orgId' = '${orgId}';`);
    // console.log("res", res.rows.map((row: any) => row.payload));
    return res.rows.map((row: any) => row.payload);
}

export async function selectAllPolicies(client: Client, orgId: string): Promise<Policy[]> {
    const res = await client.query(`select payload from Hephaestus.policy where payload->>'orgId' = '${orgId}';`);
    return res.rows.map((row: any) => row.payload);
}

export async function selectRuleData(client: Client, ruleId: string): Promise<PolicyRule> {
    // console.log("[HaesDB] selectRuleData", ruleId);
    const res = await client.query(`select payload from Hephaestus.policyrule where id = '${ruleId}';`);
    // console.log("   res", res.rows[0].payload);
    return res.rows[0].payload;
}

export async function selectControlData(client: Client, controlId: string): Promise<PolicyControl> {
    console.log("[HaesDB] selectControlData", controlId);   
    const res = await client.query(`select payload from Hephaestus.policycontrol where id = '${controlId}';`);
    return res.rows[0].payload;
}

export async function selectAllWallets(client: Client, orgId: string): Promise<Wallet[]> {
    const res = await client.query(`select Hephaestuspayload from Hephaestus.wallets where Hephaestuspayload->>'orgId' = '${orgId}';`);
    return res.rows.map((row: any) => row.Hephaestuspayload);
}

export async function selectProviderWalletId(client: Client, HephaestusWalletId: string): Promise<string> {
    const res = await client.query(`select providerpayload->>'id' as id from Hephaestus.wallets where id = '${HephaestusWalletId}';`);
    // console.log("selectProviderWalletId", res.rows[0].id);
    return res.rows[0].id;
}

export async function selectProviderWalletAddress(client: Client, HephaestusWalletId: string): Promise<string> {
    const res = await client.query(`select providerpayload->>'address' as address from Hephaestus.wallets where id = '${HephaestusWalletId}';`);
    // console.log("selectProviderWalletId", res.rows[0].id);
    return res.rows[0].address;
}

// async function dbtest(): Promise<void> {
//     selectProviderWalletId(await openConnection(), 'wc-f43d06b274c2f75c').then(console.log); 
//     selectProviderWalletAddress(await openConnection(), 'wc-f43d06b274c2f75c').then(console.log); 
// }

// dbtest();