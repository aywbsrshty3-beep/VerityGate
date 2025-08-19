/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusService.ts
 * npx ts-node .\src\Hephaestus\user\HephaestusCalls.ts  
 */
import { Wallet } from '../pe/HephaestusTypes';
import {genId, map2json, post} from '../pe/HephaestusUtils'; 

// CREATE WALLET
//  name: "EthStlWal", chain: "EthereumSepolia", provider: "DFNS"
const createWalletPayload:Wallet = {
    id: genId("wc"),
    orgId: "ORG2",
    name: "AyoubWallet",
    provider: "DFNS",
    chain: "EthereumSepolia",
    meta: new Map<string, string | number>([
        ["TYPE", "CUSTODY"]
    ])
}
const createWalletWish1 = {id: genId("WISH-wc"), actorId : "MAKER_ORG1", tgtOrgId: "ORG1", kind: "CREATE_WALLET", payload: JSON.stringify(createWalletPayload, map2json)} 

let result = post('http://localhost:4000/create-wish', createWalletWish1)
console.log("create-wallet", result.then(console.log)); 

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 1000);