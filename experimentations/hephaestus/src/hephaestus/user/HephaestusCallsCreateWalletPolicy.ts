/**
 * npx ts-node .\src\Hephaestus\user\HephaestusCalls.ts  
 */
import {genId, post} from '../pe/HephaestusUtils'; 

// CREATE WALLET POLICY - TO DO FOR BOTH ORG1 and ORG
// ORG1

const policyRuleId = "org-create-pol-rule-f9f4ae4ed6a96278"

const createWalletPolicyPayload1 = {
    "id":genId("org1-wallet-pol"),"name":"Create Wallet Policy",
    "orgId":"ORG1","subOrgApplicability":false,
    "wishKind":"CREATE_WALLET",
    "ruleIds":[policyRuleId],"controls":{policyRuleId:"org1-create-pol-ctrl-0acbee73448ed9cc"},
    "enabled":true,"dynamic":false,"validFor":1.7976931348623157e+308}
const createWalletPolicyWish1 = {id: genId("org1-wish-pol-create"), actorId : "MAKER_ORG1", tgtOrgId: "ORG1", kind: "CREATE_POLICY", payload: createWalletPolicyPayload1}
let result = post('http://localhost:4000/create-wish', createWalletPolicyWish1)
console.log("create-wallet-policy for ORG1", result.then(console.log)); 

// ORG2
const createWalletPolicyPayload2 = {
    "id":genId("org2-wallet-pol"),"name":"Create Wallet Policy",
    "orgId":"ORG2","subOrgApplicability":false,
    "wishKind":"CREATE_WALLET",
    "ruleIds":[policyRuleId],"controls":{policyRuleId:"org2-create-pol-ctrl-1c23a0e8eaf4ca6f"},
    "enabled":true,"dynamic":false,"validFor":1.7976931348623157e+308}
const createWalletPolicyWish2 = {id: genId("org2-wish-pol-create"), actorId : "MAKER_ORG2", tgtOrgId: "ORG2", kind: "CREATE_POLICY", payload: createWalletPolicyPayload2}
result = post('http://localhost:4000/create-wish', createWalletPolicyWish2)
console.log("create-wallet-policy for ORG2", result.then(console.log));

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 1000);