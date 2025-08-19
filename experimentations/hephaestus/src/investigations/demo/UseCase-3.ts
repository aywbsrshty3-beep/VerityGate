/**
 * Use Case 3: Wallet Creation for DFNS (MPC) or THALES (HSM)
 */
import { v4 as uuidv4 } from 'uuid';

import {Identifiable, Organisation, Actor, OrgStructure, Wish, Policy, PolicyRule, PolicyControl, PolicyControlConfig, CreateWalletPayload } from '../gel/types';
import  {PolicyEngine} from "../gel/PolicyEngine"

console.log("A Wallet is created");

function id(prefix: string): string {
  return (prefix + "-" + uuidv4()).toLowerCase();
}

// ORGS and ACTORS
const customerOrg: Organisation = {id: id("ORG"), name:"Customer", enabled:true}
const custMaker: Actor = {id: id("CUST-MAKER"), name: "Customer Maker", role: "MAKER", orgId: customerOrg.id, enabled: true}
const custChecker: Actor = {id: id("CUST-CHECKER"), name: "Customer Checker", role: "CHECKER", orgId: customerOrg.id, enabled: true}

// WISH CREATION: 
const wishCreationPolicyRule: PolicyRule = {
  id: id("WISH-CREATE-RULE"), name: "Wish Creation Rule", enabled: true,
  expression: "ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === 'MAKER'"}

const wishCreationPolicy: Policy = {
  id: id("WISH-CREATE-POLICY"), name: "Wish Creation Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "WISH_CREATION", 
  ruleIds: [wishCreationPolicyRule.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

function array2map<T extends Identifiable>(dao: Array<T>): Map<string, T> {
  return dao.reduce((map, dao) => {
            map.set(dao.id, dao);
            return map;
          }, new Map<string, T>());
}

// CREATE_WALLET: One Maker, One Checker
// Controls
const checkerControlConfig: PolicyControlConfig = {roles: ["CHECKER"], orgs: [customerOrg.id], minApprover: 1, timeoutInSeconds: 3600}
const policyControl: PolicyControl = {id: id("POLICY-CONTROL"), name: "CUSTOMER-CTRL", config: checkerControlConfig}

// Rules
const policyRule: PolicyRule = {id: id("POLICY-RULE"), name: "Transfer Out Rule", enabled: true }
const createWalletPolicy: Policy = {
    id: id("CREATE-WALLET-POLICY"), name: "Create Wallet Policy", orgId: customerOrg.id, subOrgApplicability: false, wishKind: "CREATE_WALLET", 
    ruleIds: [policyRule.id], controls: new Map([[policyRule.id, policyControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

const structure: OrgStructure = {
  orgs: array2map([customerOrg]), 
  actors: array2map([custMaker, custChecker]), 
  policies: array2map([wishCreationPolicy, createWalletPolicy]), 
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

const createWalletPayload: CreateWalletPayload = {name: "TJ WALLET", chain: "ETH", provider: "THALES"}
const createWalletWish: Wish = {id: id("WISH"), actorId : custMaker.id, tgtOrgId: customerOrg.id, kind: "CREATE_WALLET", payload: createWalletPayload}

pe.process(createWalletWish)