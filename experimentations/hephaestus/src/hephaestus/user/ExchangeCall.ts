/**
 * This script will create a settlement data object, and sign it crypotgraphically: cls ; npx ts-node .\src\hephaestus\user\ExchangeCall.ts
 *   
 * Generate RSA Private Key: openssl genrsa -out exchange-rsa2048.pem 2048
 * Generate the Public Key: openssl pkey -in exchange-rsa2048.pem -pubout -out exchange-rsa2048.public.pem
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import {genId, post} from '../pe/HephaestusUtils'; 
import {SettlementData, SettlementInstruction} from '../pe/HephaestusTypes';

const settlementData: SettlementData = {
    settlementId: genId("STL"),
    exchangeId: "COINBASE",

    baseAmount: "2000000000000000",
    baseOrg: "ORG1",
    baseCounterParty: "wc-2a107bd6e28693e2",  // = wa-1ol09-a00l3-9e1p9meafj5q609u
    baseTokenAddress: "native",

    termAmount: "1000000000000000",
    termOrg: "ORG2",
    termCounterParty: "wc-2ac8e5a30dd5d455", //  = wa-5jqk8-vnome-8m1rj7pe01hffng1
    termTokenAddress: "native",

    creationTime: new Date(),
    validFor: 60 // minutes
}

function signSettlementData(settlementData: SettlementData, privateKeyPath: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(settlementData));
    sign.end();

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const signature = sign.sign(privateKey, 'base64');
    return signature;
}

const privateKeyPath = 'C:/Users/tj/PERSO/DEV/Hephaestus/keys/exchange-rsa2048.pem';
const signature = signSettlementData(settlementData, privateKeyPath);

const settlementInstruction: SettlementInstruction = {
    settlementData,
    signature
};

console.log(settlementInstruction);

const publicKey = fs.readFileSync('C:/Users/tj/PERSO/DEV/Hephaestus/keys/exchange-rsa2048.public.pem', 'utf8');
const data = JSON.stringify(settlementInstruction.settlementData);

const verifier = crypto.createVerify('SHA256')
    .update(data)
    .end();
const isVerified = verifier.verify(publicKey, signature, 'base64');    


if (!isVerified) {
    console.log("[Hephaestus Service] Invalid signature for settlement instruction");
}

let result = post('http://localhost:4000/settle', settlementInstruction)
console.log("settle", result.then(console.log));    

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 5000);