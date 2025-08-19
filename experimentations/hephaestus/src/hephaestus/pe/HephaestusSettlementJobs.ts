/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusSettlementJobs.ts   
 */

import logger from './logger';
import { openConnection, insertData } from "./HephaestusDB";
import { Client } from 'pg';
import { genId, post } from './HephaestusUtils'; 
import { SettlementData, TransferOutPayload } from './HephaestusTypes';

async function monitorNewJobs(client: Client): Promise<void> {
    logger.info('Monitoring new settlement jobs...');
    const res = await client.query(
         "UPDATE Hephaestus.settlement SET processed = 'IN_PROGRESS' WHERE settlementId = (SELECT settlementId FROM Hephaestus.settlement WHERE processed = 'NEW' LIMIT 1) RETURNING *"
    );
  
    if (res.rows.length > 0) {
        try {
            const job = res.rows[0];
            console.log('job:', job);
        
            const stlData: SettlementData = JSON.parse(job.settlementdata);
            console.log('stlData:', stlData);

            // We are going to create two wishes to do transfers, once both approved, they will be inserted into the settlement table, not the jobs table
            // Another job will copy them over the jobs table, once both fullfilled.... in a database atomic transaction

            const createTransferPayload1:TransferOutPayload = {
                fromWallet: stlData.baseCounterParty, 
                toWallet: stlData.termCounterParty,
                amount: stlData.baseAmount
            }
            const createTransferWish1 = {
                id: genId("hss-stl-wish-leg1"), actorId : 
                "MAKER_HSS", 
                tgtOrgId: stlData.baseOrg,
                kind: "TRANSFER_OUT", 
                settlementId: stlData.settlementId,
                leg1: true,
                payload: createTransferPayload1
            } 
            console.log('createTransferWish1:', createTransferWish1); 

            const result1 = post('http://localhost:4000/create-wish', createTransferWish1)
            console.log("create-transfer-out-1", result1.then(console.log)); 

            const createTransferPayload2:TransferOutPayload = {
                fromWallet: stlData.termCounterParty, 
                toWallet: stlData.baseCounterParty,
                amount: stlData.termAmount
            }
            const createTransferWish2 = {
                id: genId("hss-stl-wish-leg2"), actorId : 
                "MAKER_HSS", 
                tgtOrgId: stlData.termOrg,
                kind: "TRANSFER_OUT", 
                settlementId: stlData.settlementId,
                leg1: false,
                payload: createTransferPayload2
            } 
            console.log('createTransferWish2:', createTransferWish2); 

            let result = post('http://localhost:4000/create-wish', createTransferWish2)
            console.log("create-transfer-out-2", result.then(console.log)); 
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log('No new settlement jobs found...');
    }
}

async function monitorJobsToSettle(client: Client): Promise<void> {
    logger.info('Monitoring jobs to settle...');

    const res = await client.query(
        "UPDATE Hephaestus.settlement SET processed = 'DONE' WHERE settlementId = (SELECT settlementId FROM Hephaestus.settlement WHERE processed = 'IN_PROGRESS' AND transfer1 IS NOT NULL AND transfer2 IS NOT NULL LIMIT 1) RETURNING *"
   );
 
   if (res.rows.length > 0) {
       try {
           const job = res.rows[0];
        //    console.log('job:', job);

           const settlementId = job.settlementid;
           const transfer1 = job.transfer1;
           console.log('transfer1:', transfer1);
           const transfer2 = job.transfer2;
           console.log('transfer2:', transfer2);

           await insertData(client, "Hephaestus.jobs", {id : settlementId+"-leg1", jobtype: "TRANSFER_OUT", processed: 'NEW', payload: transfer1})
           await insertData(client, "Hephaestus.jobs", {id : settlementId+"-leg2", jobtype: "TRANSFER_OUT", processed: 'NEW', payload: transfer2})

        } catch (error) {
            console.error(error);
        }
    } else {
        console.log('No new jobs to settle...');
    }
}

async function main() {
    logger.info('Starting Hephaestus Jobs Monitoring...');
    const client = await openConnection();
    while (true) {
        monitorJobsToSettle(client);
        await new Promise(resolve => setTimeout(resolve, 2 * 1000));

        monitorNewJobs(client);
        await new Promise(resolve => setTimeout(resolve, 2 * 1000));
    }
}

main();
