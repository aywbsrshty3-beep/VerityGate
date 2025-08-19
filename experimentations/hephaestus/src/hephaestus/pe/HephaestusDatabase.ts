import { Client } from 'pg';
import { Organisation, Actor, Policy, PolicyRule, PolicyControl, Wallet } from './HephaestusTypes';

export class HephaestusDatabase {
    private static instance: HephaestusDatabase;

    private connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';
    private connection = new Client({
        connectionString: this.connectionString,
    });

    private constructor() {
        this.connect();
    }

    private async connect() {
        await this.connection.connect();
    }

    public static getInstance(): HephaestusDatabase {
        if (!HephaestusDatabase.instance) {
            HephaestusDatabase.instance = new HephaestusDatabase();
        }
        return HephaestusDatabase.instance;
    }

    async insertData(tableName: string, data: any): Promise<void> {
        const keys = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`;
        await this.connection.query(query, values);
    }

    async updateData(tableName: string, data: any, id: string): Promise<void> {
        // console.log("updateData", tableName, data, id);
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const query = `UPDATE ${tableName} SET ${setClause} WHERE settlementId = $${keys.length + 1}`;
        await this.connection.query(query, [...values, id]);
    }

    async selectOrgData(orgId: string): Promise<Organisation> {
        // console.log("selectOrgData", orgId);
        const res = await this.connection.query(`select payload from Hephaestus.organization where id = '${orgId}';`);
        // console.log("res", res.rows[0].payload);
        return res.rows[0].payload;
    }

    async selectLinkedOrgs(orgId: string): Promise<string[]> {
        const res = await this.connection.query(`select linkedid from Hephaestus.linkedorgs where id = '${orgId}';`);
        return res.rows.map((row: any) => row.linkedid);
    }

    async selectActorData(actorId: string): Promise<Actor> {
        // console.log("selectActorData", actorId);
        const res = await this.connection.query(`select payload from Hephaestus.actor where id = '${actorId}';`);
        // console.log("res", res.rows[0].payload);
        return res.rows[0].payload;
    }

    async selectAllActors(orgId: string): Promise<Actor[]> {
        // console.log("selectAllActors", orgId);
        const res = await this.connection.query(`select payload from Hephaestus.actor where payload->>'orgId' = '${orgId}';`);
        // console.log("res", res.rows.map((row: any) => row.payload));
        return res.rows.map((row: any) => row.payload);
    }

    async selectAllPolicies(orgId: string): Promise<Policy[]> {
        const res = await this.connection.query(`select payload from Hephaestus.policy where payload->>'orgId' = '${orgId}';`);
        return res.rows.map((row: any) => row.payload);
    }

    async selectRuleData(ruleId: string): Promise<PolicyRule> {
        // console.log("[HaesDB] selectRuleData", ruleId);
        const res = await this.connection.query(`select payload from Hephaestus.policyrule where id = '${ruleId}';`);
        // console.log("   res", res.rows[0].payload);
        return res.rows[0].payload;
    }

    async selectControlData(controlId: string): Promise<PolicyControl> {
        console.log("[HaesDB] selectControlData", controlId);
        const res = await this.connection.query(`select payload from Hephaestus.policycontrol where id = '${controlId}';`);
        return res.rows[0].payload;
    }

    async selectAllWallets(orgId: string): Promise<Wallet[]> {
        const res = await this.connection.query(`select Hephaestuspayload from Hephaestus.wallets where Hephaestuspayload->>'orgId' = '${orgId}';`);
        return res.rows.map((row: any) => row.Hephaestuspayload);
    }

    async selectProviderWalletId(HephaestusWalletId: string): Promise<string> {
        const res = await this.connection.query(`select providerpayload->>'id' as id from Hephaestus.wallets where id = '${HephaestusWalletId}';`);
        // console.log("selectProviderWalletId", res.rows[0].id);
        return res.rows[0].id;
    }

    async selectProviderWalletAddress(HephaestusWalletId: string): Promise<string> {
        const res = await this.connection.query(`select providerpayload->>'address' as address from Hephaestus.wallets where id = '${HephaestusWalletId}';`);
        // console.log("selectProviderWalletId", res.rows[0].id);
        return res.rows[0].address;
    }
}

// async function main() {
//     const db = HephaestusDatabase.getInstance();
//     db.selectProviderWalletId('wc-578cd2ff10cc9eb1').then(console.log); 
// }

// main();