/**
 * Use Case 4: Same as Use Case 3 but using Policy Control Config - Simpler
 */

import { Identifiable, Organisation, Actor, OrgStructure, Wish, Policy, PolicyRule, PolicyControl, PolicyControlConfig, Wallet, TransferOutPayload } from '../gel/types';

import  {PolicyEngine} from "../gel/PolicyEngine"

console.log("A Settlement Wallet Controlled by an Exchange and a Customer for Settlement Purposes");

// ORGS and ACTORS
const exchangeOrg: Organisation = {id: "EXC-ORG-1", name:"Exchange", enabled:true}
const excMaker: Actor = {id: "E-M-1", name: "Exchange Maker", role: "MAKER", orgId: exchangeOrg.id, enabled: true}
const excChecker: Actor = {id: "E-C-1", name: "Exchange Checker", role: "CHECKER", orgId: exchangeOrg.id, enabled: true}

const customerOrg: Organisation = {id: "CUT-ORG-1", name:"Customer", enabled:true}
const custMaker: Actor = {id: "C-M-1", name: "Customer Maker", role: "MAKER", orgId: customerOrg.id, enabled: true}
const custChecker: Actor = {id: "C-C-1", name: "Customer Checker", role: "CHECKER", orgId: customerOrg.id, enabled: true}

const myBTCWallet: Wallet = {id: "MyBTCWallet", name: "BTC Trading Wallet", orgId: customerOrg.id, chain: "TESTNET", meta: new Map([["TYPE", "SETTLEMENT"]])}
const wallets: Map<string, Wallet> = new Map([["MyBTCWallet", myBTCWallet]]); 

// WISH CREATION: Allowed for the exchange's maker role and for the customer's maker role on a settlement wallet

const wishCreationPolicyRule: PolicyRule = {
    id: "WPR-1", name: "Wish Creation Rule", enabled: true,
    expression: 
    `
    ((ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === "MAKER") ||
    (ctx.orgs[ctx.actors[ctx.wish.actorId].orgId].id === "EXC-ORG-1" && ctx.wallets[ctx.wish.payload.fromWallet].meta["TYPE"] === "SETTLEMENT"))
    `}

const wishCreationPolicy: Policy = {
    id: "WCP-1", name: "Wish Creation Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "WISH_CREATION", 
    ruleIds: [wishCreationPolicyRule.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

function array2map<T extends Identifiable>(dao: Array<T>): Map<string, T> {
  return dao.reduce((map, dao) => {
            map.set(dao.id, dao);
            return map;
          }, new Map<string, T>());
}

// TRANSFER OUT: If the exchange wants to transfer out, the customer must say yes, and vice-versa
// There is a 1 Transfer Out Policy with 2 Rules and 2 Controls
// We always start bottom up
// Controls
const policyControlConfig: PolicyControlConfig = {roles: ["CHECKER", "CHECKER"], orgs: [customerOrg.id, exchangeOrg.id], minApprover: 2, timeoutInSeconds: 3600}
const policyControl: PolicyControl = {id: "CUST-POL-CTRL", name: "CUST-POLICY-CTRL", config: policyControlConfig}


// Rules
// Maker is from the customer, targeting the customer, as a maker on a settlement wallet
const policyRule: PolicyRule = {id: "CUST-RULE-1", name: "Transfer Out Rule", 
  expression: `
    (ctx.actors[ctx.wish.actorId].orgId === "EXC-ORG-1" || ctx.actors[ctx.wish.actorId].orgId === "CUT-ORG-1") && 
    ctx.actors[ctx.wish.actorId].role === "MAKER" &&
    ctx.wallets[ctx.wish.payload.fromWallet].orgId === ctx.wish.tgtOrgId && 
    ctx.wallets[ctx.wish.payload.fromWallet].meta["TYPE"] === "SETTLEMENT"
  `, enabled: true }
const policy: Policy = {
    id: "TFTO-CUST-POL-1", name: "Transfer Out Customer Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "TRANSFER_OUT", 
    ruleIds: [policyRule.id], controls: new Map([[policyRule.id, policyControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}


const structure: OrgStructure = {
  orgs: array2map([customerOrg, exchangeOrg]), 
  actors: array2map([excMaker, excChecker, custMaker, custChecker]), 
  policies: array2map([wishCreationPolicy, policy]), 
  rules: array2map([wishCreationPolicyRule, policyRule]), 
  controls: array2map([policyControl])} 

function map2json(key:string, value:any) {
    if(value instanceof Map) {
        const jsonObject = Object.fromEntries(value);
        // const jsonString = JSON.stringify(jsonObject);
        return jsonObject;
    } else {
        return value;
    }
}
// console.log(JSON.stringify(structure, map2json))

const pe: PolicyEngine = new PolicyEngine(structure)
structure.wallets = wallets;

const customerTransferOutPayload: TransferOutPayload = {fromWallet: "MyBTCWallet", toAddress: "0x123", amount: "5001"}
const customerTftOutWish: Wish = {id: "WISH-1", actorId : custMaker.id, tgtOrgId: customerOrg.id, kind: "TRANSFER_OUT", payload: customerTransferOutPayload}

pe.process(customerTftOutWish)

const exchangeTransferOutPayload: TransferOutPayload = {fromWallet: "MyBTCWallet", toAddress: "0x546", amount: "8000"}
const exchangeTftOutWish: Wish = {id: "WISH-2", actorId : excMaker.id, tgtOrgId: customerOrg.id, kind: "TRANSFER_OUT", payload: exchangeTransferOutPayload}

pe.process(exchangeTftOutWish)