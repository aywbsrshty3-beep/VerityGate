/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusService.ts
 * npx ts-node .\src\Hephaestus\user\HephaestusCalls.ts  
 */
import {genId, post} from '../pe/HephaestusUtils'; 

const policyRule = "org-create-pol-rule-f9f4ae4ed6a96278"

// CREATE TRANSFER POLICY
const createTftOutPolicyPayload1 =  {
    "id":genId("CREATE-TFT-OUT-POL-1"),
    "name":"Create Tft Policy",
    "orgId":"ORG1",
    "subOrgApplicability":false,
    "wishKind":"TRANSFER_OUT",
    "ruleIds":[policyRule],
    "controls":{policyRule:"org1-create-pol-ctrl-0acbee73448ed9cc"},
    "enabled":true,
    "dynamic":false,
    "validFor":1.7976931348623157e+308}
const createTftOutPolicyWish1 = {
    id: genId("WISH"), 
    actorId : "MAKER_ORG1", 
    tgtOrgId: "ORG1", 
    kind: "CREATE_POLICY", 
    payload: createTftOutPolicyPayload1
}
const result1 = post('http://localhost:4000/create-wish', createTftOutPolicyWish1)
console.log("create-tft-out-policy-1", result1.then(console.log)); 

const createTftOutPolicyPayload2 =  {
    "id":genId("CREATE-TFT-OUT-POL-2"),
    "name":"Create Tft Policy",
    "orgId":"ORG2",
    "subOrgApplicability":false,
    "wishKind":"TRANSFER_OUT",
    "ruleIds":[policyRule],
    "controls":{policyRule:"org2-create-pol-ctrl-1c23a0e8eaf4ca6f"},
    "enabled":true,
    "dynamic":false,
    "validFor":1.7976931348623157e+308}
const createTftOutPolicyWish2 = {
    id: genId("WISH"), 
    actorId : "MAKER_ORG2", 
    tgtOrgId: "ORG2", 
    kind: "CREATE_POLICY", 
    payload: createTftOutPolicyPayload2
}
const result2 = post('http://localhost:4000/create-wish', createTftOutPolicyWish2)
console.log("create-tft-out-policy-1", result2.then(console.log)); 

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 1000);