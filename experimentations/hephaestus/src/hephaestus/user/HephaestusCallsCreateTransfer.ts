/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusService.ts
 * npx ts-node .\src\Hephaestus\user\HephaestusCalls.ts  
 */
import { TransferOutPayload } from '../pe/HephaestusTypes';
import {genId, post} from '../pe/HephaestusUtils'; 


// CREATE TRANSFER
// https://docs.dfns.co/d/api-docs/wallets/transfer-asset-from-wallet
const createTransferPayload:TransferOutPayload = {
    fromWallet: "wc-2a107bd6e28693e2", 
    toWallet: "wc-2ac8e5a30dd5d455", 
    amount: "2000000000000000"
}

const createTransferWish = {
    id: genId("WISH"), actorId : 
    "MAKER_ORG1", 
    tgtOrgId: "ORG1", 
    kind: "TRANSFER_OUT", 
    payload: createTransferPayload
} 

let result = post('http://localhost:4000/create-wish', createTransferWish)
console.log("create-transfer-out", result.then(console.log)); 

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 1000);