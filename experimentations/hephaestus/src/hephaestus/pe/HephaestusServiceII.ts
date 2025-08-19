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

import { HephaestusDatabase } from './HephaestusDatabase';
import { Organisation, Actor, OrgStructure, Policy, PolicyRule, Wish, PolicyControl, SettlementInstruction, Wallet } from './HephaestusTypes';
import { HephaestusPolicyEngine } from './HephaestusPolicyEngine';
import { array2map, genId, map2json } from './HephaestusUtils';
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
const PORT = 4000;

const db = HephaestusDatabase.getInstance();

app.listen(PORT, () => {
    console.log("[Hephaestus Service II] is running on port", PORT);
});

/**
 * The policy engine will evaluate the wish against the policies of the target org, and the top ones.
 * @param targetOrgId 
 * @returns OrgStructure
 */
async function buildTargetOrgStruct(targetOrgId: string): Promise<OrgStructure> {
    console.log("buildTargetOrgStructg", targetOrgId);

    const allOrgs: Organisation[] = [];
    const allActors: Actor[] = await db.selectAllActors(targetOrgId);

    const org: Organisation = await db.selectOrgData(targetOrgId);
    allOrgs.push(org);
    const linkedOrgs: string[] = await db.selectLinkedOrgs(targetOrgId);
    for (const linkedOrg of linkedOrgs) {
        const linkedOrgData: Organisation = await db.selectOrgData(linkedOrg);
        allOrgs.push(linkedOrgData);
        allActors.push(...await db.selectAllActors(linkedOrg));
    }

    const allPolicies: Policy[] = await db.selectAllPolicies(targetOrgId);
    const allRules: PolicyRule[] = [];
    for (const p of allPolicies) {
        for (const ruleId of p.ruleIds) {
            // console.log("       ruleId", ruleId);
            const rule: PolicyRule = await db.selectRuleData(ruleId);
            allRules.push(rule);
        }
    }

    const allControls: PolicyControl[] = [];
    for (const p of allPolicies) {
        const controls: Map<string, string> = new Map<string, string>(Object.entries(p.controls));
        for (const c of controls.values()) {
            const control: PolicyControl = await db.selectControlData(c);
            allControls.push(control);
        }
    }

    const allWallets: Wallet[] = await db.selectAllWallets(targetOrgId);

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
 * A Policy has a subOrgApplicability flag - if applied its policies apply downward.
 * If we have 3 levels, and the top level has a policy with subOrgApplicability, it will apply to all 3 levels.
 * Policies should then apply top to bottom.
 * Logic: (1) List all orgs from targetOrg back to top org if any -> [tgt Org, ..., top Org]
 *        (2) From the top org, list all policies that are enabled and of the right kind and with subOrgApplicability set to true -> [pol1, ..., poln]
 * 
 * @param targetOrgId 
 * @param wishKind 
 * @returns All the policies, from target org to the top, that are enabled and of the right kind
 */
async function selectPolicies(targetOrgId: string, wishKind: string): Promise<Policy[]> {
    return [];
}

/**
 * curl -X POST -d @CreateWallet.json http://localhost:4000/create-wallet
 */
app.post('/create-wish', async (req: Request, res: Response) => {
    try {
        const wish: Wish = req.body;
        console.log("[Hephaestus Service] wish:", wish);
        await db.insertData("Hephaestus.wish", { id: wish.id, payload: JSON.stringify(wish, map2json) });

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
    switch (wishKind) {
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
    if (wish.settlementId) {
        if (wish.leg1) {
            await db.updateData("Hephaestus.settlement", { transfer1: wish.payload }, wish.settlementId);
        } else {
            await db.updateData("Hephaestus.settlement", { transfer2: wish.payload }, wish.settlementId);
        }
    } else {
        await db.insertData("Hephaestus.jobs", { id: genId("tft-out"), jobtype: "TRANSFER_OUT", processed: 'NEW', payload: wish.payload })
    }
}

async function createPolicy(wish: Wish) {
    const policy: Policy = wish.payload;

    await db.insertData("Hephaestus.policy", { id: policy.id, payload: JSON.stringify(policy, map2json) });
    console.log("[Hephaestus Service] created policy", policy);
}


async function createWallet(wish: Wish) {
    await db.insertData("Hephaestus.jobs", { id: genId("wc"), jobtype: "WALLET_CREATION", processed: 'NEW', payload: wish.payload })
}

app.post('/settle', async (req: Request, res: Response) => {
    try {
        console.log("[Hephaestus Service] settle");

        const settlementInstruction: SettlementInstruction = req.body;
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

        await db.insertData("Hephaestus.settlement", { settlementId: settlementData.settlementId, settlementData: settlementData });

    } catch (error) {
        console.error(error)
        res.status(500);
    }
});