import * as fs from 'fs';
import * as path from 'path';
import { OrgStructure } from '../pe/HephaestusTypes';
import {map2json } from '../pe/HephaestusUtils';

async function setUpOrgStructTest(): Promise<void> {
    const jsonFilePath = path.join('C:', 'Users', 'tj', 'PERSO', 'DEV', 'Hephaestus', 'dfns-jsons', 'stl-org-structure-2.json');

    function loadJsonFile(filePath: string): any {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('Error reading or parsing the file:', err);
            return null;
        }
    }

    const orgStructJSON = loadJsonFile(jsonFilePath);

    const RULE_ID = "hss-wish-rule-org2-0d973daf8d747ecd";

    const orgStruct: OrgStructure = orgStructJSON as OrgStructure;
    // console.log("orgStruct:", orgStruct);  
    const rulesMap = new Map(Object.entries(orgStruct.rules));
    const expression = rulesMap.get(RULE_ID)?.expression;
    console.log("expression:", expression); 

    const document: string = JSON.stringify(orgStruct, map2json);

    /**
     *   ctx.actors[ctx.wish.actorId].orgId === 'HSS' &&
    ctx.wish.tgtOrgId === 'ORG2' &&
    ctx.wish.kind === 'TRANSFER_OUT' &&
    ctx.wallets[ctx.wish.payload.fromWallet].meta['TYPE'] === 'SETTLEMENT' &&
    ctx.actors[ctx.wish.actorId].role === 'MAKER'
     */

    const myExpression = `
          ctx.wish.payload.fromWallet
    `;

    if (expression) {
        const expr = 
        `
            const ctx = ${document};
            ${myExpression}
        `;

        console.log("Evaluating expression...", expr);
        console.log("Wish:", orgStruct.wish);

        const res =  eval(expr)
        
        console.log("Expression evaluation: ", res);
    }
}


setUpOrgStructTest();