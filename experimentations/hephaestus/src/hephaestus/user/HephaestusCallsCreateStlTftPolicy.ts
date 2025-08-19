/**
 * npx ts-node .\src\Hephaestus\pe\HephaestusService.ts
 * npx ts-node .\src\Hephaestus\user\HephaestusCalls.ts  
 */
import {genId, post} from '../pe/HephaestusUtils'; 


// FOR SETTLEMENT PURPOSE, WE NEED TRANSFER OUT POLICIES FROM ORG1 AND ORG2
// HSS is the MAKER for ORG1 and ORG2, EXC is the CHECKER for ORG1 and ORG2 on a TRANSFER_OUT for a wallet of type SETTLEMENT
const createTftOutPolicyPayload1 =  {
    "id":genId("org1-stl-pol"),
    "name":"Tft Out Policy",
    "orgId":"ORG1",
    "subOrgApplicability":false,
    "wishKind":"TRANSFER_OUT",
    "ruleIds":["hss-wish-rule-org1-5cd81add03e07bda"],
    "controls":{"hss-wish-rule-org1-5cd81add03e07bda":"exc-tft-pol-9254b4d1c0838132"},
    "enabled":true,
    "dynamic":false,
    "validFor":1.7976931348623157e+308}
const createTftOutPolicyWish1 = {
    id: genId("org1-wish-stl-pol"), 
    actorId : "MAKER_ORG1", 
    tgtOrgId: "ORG1", 
    kind: "CREATE_POLICY", 
    payload: createTftOutPolicyPayload1
}
const result1 = post('http://localhost:4000/create-wish', createTftOutPolicyWish1)
console.log("create-tft-out-policy", result1.then(console.log)); 

const createTftOutPolicyPayload2 =  {
    "id":genId("org2-stl-pol"),
    "name":"Tft Out Policy",
    "orgId":"ORG2",
    "subOrgApplicability":false,
    "wishKind":"TRANSFER_OUT",
    "ruleIds":["hss-wish-rule-org2-52575c7fcda7dcba"],
    "controls":{"hss-wish-rule-org2-52575c7fcda7dcba":"exc-tft-pol-9254b4d1c0838132"},
    "enabled":true,
    "dynamic":false,
    "validFor":1.7976931348623157e+308}
const createTftOutPolicyWish2 = {
    id: genId("org2-wish-stl-pol"), 
    actorId : "MAKER_ORG2", 
    tgtOrgId: "ORG2", 
    kind: "CREATE_POLICY", 
    payload: createTftOutPolicyPayload2
}
const result2 = post('http://localhost:4000/create-wish', createTftOutPolicyWish2)
console.log("create-tft-out-policy", result2.then(console.log)); 

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 1000);