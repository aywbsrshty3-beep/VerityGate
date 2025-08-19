import logger from './logger';
import { openConnection, insertData, selectProviderWalletId, selectProviderWalletAddress } from "./HephaestusDB";
import { Client } from 'pg';
import { post } from './HephaestusUtils'; 

async function monitorJobs(client: Client): Promise<void> {
    logger.info('Monitoring jobs...');

    const myClient = await openConnection();
    
    const res = await client.query(
         "UPDATE Hephaestus.jobs SET processed = 'IN_PROGRESS' WHERE id = (SELECT id FROM Hephaestus.jobs WHERE processed = 'NEW' LIMIT 1) RETURNING *"
    );
    const job = res.rows[0];
    // console.log("job...", res.rows)
    // console.log("job...", job)

    if (res.rows.length > 0) {
        try {
            
            logger.info('Found job:', job);
            // The job has a provider - so either we call the appropriate provider or the provider selects its own job
            // tbd
            let result;

            switch (job.jobtype) {
                case 'WALLET_CREATION':
                    // TODO: Take job.payload.provider into consideration
                    result = post('http://localhost:3000/create-wallet', {
                        "network": job.payload.chain,
                        "name": job.payload.name
                    })
                    let response = await result;
                    console.log("WALLET_CREATION/Response received:", response);    
                    console.log("WALLET_CREATION/Status received:", response.status);    
                    if (response.status === 'Active') {
                        await client.query(
                            "UPDATE Hephaestus.jobs SET processed = 'SUCCESS' WHERE id = $1",
                            [job.id]
                        );
                        // TODO ... Hephaestus.wallets has changed!
                        insertData(client, 'Hephaestus.wallets', {
                            id: job.payload.id, 
                            provider: job.payload.provider, 
                            Hephaestuspayload: job.payload,
                            providerpayload: response
                        }); 
        
                        logger.info(`Job ${job.id} processed successfully.`);
                    } else {
                        await client.query(
                            "UPDATE Hephaestus.jobs SET processed = 'FAILURE' WHERE id = $1",
                            [job.id]
                        );
                        logger.error(`Job ${job.id} failed with status: ${response.status}`);
                    }
                break;
                case 'TRANSFER_OUT':
                    // TODO: Take job.payload.provider into consideration
                    // TODO: find the native wallet id for from and the native address for to
                    const fromWallet = await selectProviderWalletId(myClient, job.payload.fromWallet);   
                    const toAddress = await selectProviderWalletAddress(myClient, job.payload.toWallet);

                    result = post('http://localhost:3000/create-transfer', {
                        "fromWallet": fromWallet,
                        "toAddress": toAddress,
                        "amount": job.payload.amount
                    })
                    response = await result;
                    console.log("TRANSFER_OUT/Response received:", response);    
                    console.log("TRANSFER_OUT/Status received:", response.status);    
                    if (response.status === 'Approved') {
                        await client.query(
                            "UPDATE Hephaestus.jobs SET processed = 'SUCCESS' WHERE id = $1",
                            [job.id]
                        );
                        insertData(client, 'Hephaestus.wallets', {id: response.id, provider: "DFNS", payload: response}); 
        
                        logger.info(`Job ${job.id} processed successfully.`);
                    } else {
                        await client.query(
                            "UPDATE Hephaestus.jobs SET processed = 'FAILURE' WHERE id = $1",
                            [job.id]
                        );
                        logger.error(`Job ${job.id} failed with status: ${response.status}`);
                    }
            
            } // switch
        } catch (error) {
        }
    }
}

async function main() {
    logger.info('Starting Hephaestus Jobs Monitoring...');
    const client = await openConnection();
    while (true) {
        monitorJobs(client);
        await new Promise(resolve => setTimeout(resolve, 10 * 1000));
    }
}

main();
