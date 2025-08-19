import * as fs from 'fs';
import * as path from 'path';
import { Wallet } from '../pe/HephaestusTypes';
import { genId, map2json } from '../pe/HephaestusUtils';
import { openConnection, insertData } from '../pe/HephaestusDB';

async function setUpData(): Promise<void> {

    const jsonFilePath = path.join('C:', 'Users', 'tj', 'PERSO', 'DEV', 'Hephaestus', 'dfns-jsons', 'wallets.json');

    function loadJsonFile(filePath: string): any {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('Error reading or parsing the file:', err);
            return null;
        }
    }

    const wallets = loadJsonFile(jsonFilePath);

    const items = wallets.items;

    for(const nativePayload of items) {
        let org = "ORG1";
        if (nativePayload.id === "wa-5jqk8-vnome-8m1rj7pe01hffng1") {
            org = "ORG2";
        }

        const HephaestusPayload: Wallet = {
            id: genId("wc"),
            orgId: org,
            name: nativePayload.name,
            provider: "DFNS",
            chain: nativePayload.network,
            meta: new Map<string, string | number>([
                ["TYPE", "SETTLEMENT"]
            ])
        }

        console.log("NATIVE::", nativePayload);
        console.log("Hephaestus:", HephaestusPayload);

        const dbClient = await openConnection();
        insertData(dbClient, "Hephaestus.wallets", { 
            id: HephaestusPayload.id, 
            provider: HephaestusPayload.provider, 
            HephaestusPayload: JSON.stringify(HephaestusPayload, map2json),
            providerPayload: JSON.stringify(nativePayload, map2json)
        });        
     }
}

setUpData();

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 5000);

