/**
 * Use Case 2: A Settlement Wallet Controlled by an Exchange and a Customer for Settlement Purposes:
 *             Withdrawls must be authorized by both parties
 * Note: might be useful to enable a third-party org for an org to interact with
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
const customerCheckerControlConfig: PolicyControlConfig = {roles: ["CHECKER"], orgs: [customerOrg.id], minApprover: 1, timeoutInSeconds: 3600}
const customerPolicyControl: PolicyControl = {id: "CUST-POL-CTRL-1", name: "CUSTOMER-CTRL", config: customerCheckerControlConfig}

const exchangeCheckerControlConfig: PolicyControlConfig = {roles: ["CHECKER"], orgs: [exchangeOrg.id], minApprover: 1, timeoutInSeconds: 3600}
const exchangePolicyControl: PolicyControl = {id: "EXC-POL-CTRL-1", name: "EXCHANGE-CTRL", config: exchangeCheckerControlConfig}

// Rules
// Maker is from the customer, targeting the customer, as a maker on a settlement wallet
const customerPolicyRule: PolicyRule = {id: "CUST-RULE-1", name: "Transfer Out Rule", 
  expression: `
    ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && 
    ctx.actors[ctx.wish.actorId].role === "MAKER" &&
    ctx.wallets[ctx.wish.payload.fromWallet].orgId === ctx.wish.tgtOrgId && 
    ctx.wallets[ctx.wish.payload.fromWallet].meta["TYPE"] === "SETTLEMENT"
  `, enabled: true }
const transferOutCustomerPolicy: Policy = {
    id: "TFTO-CUST-POL-1", name: "Transfer Out Customer Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "TRANSFER_OUT", 
    ruleIds: [customerPolicyRule.id], controls: new Map([[customerPolicyRule.id, customerPolicyControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

const exchangePolicyRule: PolicyRule = {id: "EXC-RULE-1", name: "Transfer Out Rule",
  expression: `
    ctx.orgs[ctx.actors[ctx.wish.actorId].orgId].id === "EXC-ORG-1" && 
    ctx.wallets[ctx.wish.payload.fromWallet].meta["TYPE"] === "SETTLEMENT" &&
    ctx.wallets[ctx.wish.payload.fromWallet].orgId === "CUT-ORG-1"
  `, enabled: true }
const transferOutExchangePolicy: Policy = {
    id: "TFTO-EXC-POL-1", name: "Transfer Out Exchange Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "TRANSFER_OUT", 
    ruleIds: [exchangePolicyRule.id], controls: new Map([[exchangePolicyRule.id, exchangePolicyControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

const structure: OrgStructure = {
  orgs: array2map([customerOrg, exchangeOrg]), 
  actors: array2map([excMaker, excChecker, custMaker, custChecker]), 
  policies: array2map([wishCreationPolicy, transferOutCustomerPolicy, transferOutExchangePolicy]), 
  rules: array2map([wishCreationPolicyRule, customerPolicyRule, exchangePolicyRule]), 
  controls: array2map([customerPolicyControl, exchangePolicyControl])} 

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