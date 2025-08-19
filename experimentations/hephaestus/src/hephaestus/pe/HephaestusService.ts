/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusService.ts
 * npx ts-node .\src\Hephaestus\plugins\dfns\DfnsServiceProvider.ts
 * npx ts-node .\src\Hephaestus\pe\HephaestusJobs.ts 
 * npx ts-node .\src\Hephaestus\user\HephaestusCallsCreateWalletPolicy.ts
 * npx ts-node .\src\Hephaestus\bootstrap\CreateBootstrap4StlUseCase.ts
 * npx ts-node .\src\Hephaestus\pe\HephaestusSettlementJobs.ts   
 */

import express, { Request, Response } from 'express';
const bodyParser = require('body-parser');

import {Organisation, Actor, OrgStructure, Policy, PolicyRule, Wish, PolicyControl, SettlementInstruction, Wallet} from './HephaestusTypes';
import { openConnection, insertData, updateData, selectOrgData,selectLinkedOrgs, selectAllActors, selectAllPolicies, selectRuleData, selectControlData, selectAllWallets } from './HephaestusDB';
import { HephaestusPolicyEngine } from './HephaestusPolicyEngine';
import { array2map, genId, map2json } from './HephaestusUtils'; 
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
const PORT = 4000;

app.listen(PORT, () => {
    console.log("[Hephaestus Service] is running on port", PORT);
});

async function buildTargetOrgStruct(orgId: string): Promise<OrgStructure> {
    console.log("buildTargetOrgStructg", orgId);    
    const dbClient = await openConnection();

    const allOrgs: Organisation[] = [];
    const allActors: Actor[] = await selectAllActors(dbClient, orgId);

    const org: Organisation = await selectOrgData(dbClient, orgId);
    allOrgs.push(org);
    const linkedOrgs: string[] = await selectLinkedOrgs(dbClient, orgId);
    // console.log("   orgs and actors...");    
    for(const linkedOrg of linkedOrgs) {
        const linkedOrgData: Organisation = await selectOrgData(dbClient, linkedOrg);
        allOrgs.push(linkedOrgData);
        allActors.push(...await selectAllActors(dbClient, linkedOrg));    
    }
    // console.log("   orgs", allOrgs);
    // console.log("   actors", allActors);
        
    const allPolicies: Policy[] = await selectAllPolicies(dbClient, orgId);
    const allRules: PolicyRule[] = [];
    // console.log("   policies and rules...");    
    for(const p of allPolicies) {
        // console.log("   rules for policy", p.id, p);
        for(const ruleId of p.ruleIds) {
            // console.log("       ruleId", ruleId);
            const rule:PolicyRule = await selectRuleData(dbClient, ruleId);
            allRules.push(rule);
        }
    }
    // console.log("   policies", allPolicies);
    // console.log("   rules", allRules);

    const allControls: PolicyControl[] = [];
    // console.log("   controls...");    
    for(const p of allPolicies) {
        const controls: Map<string, string> = new Map<string, string>(Object.entries(p.controls));
        for(const c of controls.values()) {
            const control: PolicyControl = await selectControlData(dbClient, c);
            allControls.push(control);
        }
    }

    const allWallets: Wallet[] = await selectAllWallets(dbClient, orgId);   
    // console.log("   allWallets", allWallets);   

    const structure: OrgStructure = {
        orgs: array2map(allOrgs), 
        actors: array2map(allActors), 
        policies: array2map(allPolicies),
        rules: array2map(allRules),
        controls: array2map(allControls),
        wallets: array2map(allWallets)
    }

    return structure;
}

/**
 * curl -X POST -d @CreateWallet.json http://localhost:4000/create-wallet
 */
app.post('/create-wish', async (req: Request, res: Response) => {
    try {
        const wish: Wish = req.body;
        console.log("[Hephaestus Service] wish:", wish);  
        const client = await openConnection();
        await insertData(client, "Hephaestus.wish", {id: wish.id, payload: JSON.stringify(wish, map2json)});   

        // 1. Build a OrgStructure using the Wish actor Id (actor to org, actors/policies/rules/controls of org)
        const orgStructure = await buildTargetOrgStruct(wish.tgtOrgId);   

        // 2. Use the PolicyEngine to process the Wish
        const policyEngine = new HephaestusPolicyEngine(orgStructure);
        const result = policyEngine.process(wish)
        console.log("[Hephaestus Service] result", result);

        // 3. Simulate Wish Creation
        // (The PE would first evaluate the controls for another process to execute the wish...)
        // The wish has been approved, we need to execute its payload   
        if (result) {
            processWish(wish);
        } else {
            console.log("[Hephaestus Service] Wish not processed");
        }

    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

async function processWish(wish: Wish): Promise<void> {
    console.log("[Hephaestus Service] persisting wish's job", wish);
    const wishKind = wish.kind;
    switch(wishKind) {
        case "CREATE_WALLET":
            createWallet(wish);
            break;
        case "TRANSFER_OUT":
            createTransferOut(wish);
            break;
        case "CREATE_POLICY":
            createPolicy(wish);
            break;
        default:
            console.error("[Hephaestus Service] processWish: Unknown wish kind: %s", wishKind);
    }
}

async function createTransferOut(wish: Wish) {
    const client = await openConnection();
    if (wish.settlementId) {
        if (wish.leg1) {
            await updateData(client, "Hephaestus.settlement", {transfer1 : wish.payload}, wish.settlementId);
        } else {
            await updateData(client, "Hephaestus.settlement", {transfer2 : wish.payload}, wish.settlementId);
        }
    } else {
        await insertData(client, "Hephaestus.jobs", {id : genId("tft-out"), jobtype: "TRANSFER_OUT", processed: 'NEW', payload: wish.payload})
    }
}

async function createPolicy(wish: Wish) {
    const policy: Policy = wish.payload;

    const client = await openConnection();
    await insertData(client, "Hephaestus.policy", {id: policy.id, payload: JSON.stringify(policy, map2json)});       
    console.log("[Hephaestus Service] created policy", policy);    
}


async function createWallet(wish: Wish) {
    const client = await openConnection();
    await insertData(client, "Hephaestus.jobs", {id : genId("wc"), jobtype: "WALLET_CREATION", processed: 'NEW', payload: wish.payload})
}

app.post('/settle', async (req: Request, res: Response) => {
    try {
        console.log("[Hephaestus Service] settle");   

        const settlementInstruction:SettlementInstruction = req.body;
        const settlementData = settlementInstruction.settlementData;
        console.log("[Hephaestus Service] settlementData", settlementData); 

        const creationTime = settlementData.creationTime;
        const validFor = settlementData.validFor;
        const expirationTime = new Date(creationTime);
        expirationTime.setMinutes(expirationTime.getMinutes() + validFor);

        if (expirationTime < new Date()) {
            console.log("[Hephaestus Service] Settlement instruction has expired");
            res.status(400).send("Settlement instruction has expired");
            return;
        }

        const publicKey = fs.readFileSync('C:/Users/tj/PERSO/DEV/Hephaestus/keys/exchange-rsa2048.public.pem', 'utf8');
        const data = JSON.stringify(settlementInstruction.settlementData);
        const verifier = crypto.createVerify('SHA256').update(data).end();
        const isVerified = verifier.verify(publicKey, settlementInstruction.signature, 'base64');    

        if (!isVerified) {
            console.log("[Hephaestus Service] Invalid signature for settlement instruction");
            res.status(400).send("Invalid signature for settlement instruction");
            return;
        }

        console.log("[Hephaestus Service] Settlement instruction verified");

        const client = await openConnection();
        await insertData(client, "Hephaestus.settlement", {settlementId: settlementData.settlementId, settlementData: settlementData});     

    } catch (error) {
        console.error(error)
        res.status(500);
    }
});