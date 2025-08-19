/**
 * Use Case 1: Basic Demo of a Wish Creation & Transfer Out Policies from a Single Organisation
 */

import { Organisation, Actor, OrgStructure, Wish, Policy, PolicyRule, PolicyControl, PolicyControlConfig, Wallet, TransferOutPayload } from '../gel/types';
import  {PolicyEngine} from "../gel/PolicyEngine"

console.log("Use Case 1: Basic Demo of a Wish Creation & Transfer Out Policies from a Single Organisation");

const corp: Organisation = {id: "SC1", name:"SuperCorp", enabled:true}

const tj: Actor = {id: "TJ", name: "Thierry", role: "MAKER", orgId: "SC1", enabled: true}
const cj: Actor = {id: "CJ", name: "Claire", role: "CHECKER", orgId: "SC1", enabled: true}
const co: Actor = {id: "CO", name: "CO", role: "COMPLIANCE_OPS", orgId: "SC1", enabled: true}
const wls: Actor = {id: "WLS", name: "WHITELIST SERVICE", role: "WL_SERVICE", orgId: "SC1", enabled: true}
const kyts: Actor = {id: "KYT", name: "KYT SERVICE", role: "KYT_SERVICE", orgId: "SC1", enabled: true}

// DEFAULT CONTROL
const defaultControl: PolicyControl = {id: "DFCTRL", name: "DFCTRL"}

// WISH CREATION
const wishCreationPolicyRule: PolicyRule = {
    id: "WPR-1", name: "Wish Creation Rule", enabled: true,
    expression: "ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === 'MAKER'"}

const wishCreationPolicy: Policy = {
    id: "WP-1", name: "Wish Creation Policy", orgId: corp.id, subOrgApplicability: false, wishKind: "WISH_CREATION", 
    ruleIds: [wishCreationPolicyRule.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE}

// TRANSFER OUT
// CHECKER AND (WL_SERVICE OR COMPLIANCE_OFFICER) AND (KYT_SERVICE OR COMPLIANCE_OFFICER)
const checkerCtrlCfg: PolicyControlConfig = {roles: ["CHECKER"], orgs: ["SC1"], minApprover: 1, timeoutInSeconds: 3600}
const wlsCtrlCfg: PolicyControlConfig = {roles: ["WL_SERVICE"], orgs: ["SC1"], minApprover: 1, timeoutInSeconds: 3600}
const kytCtrlCfg: PolicyControlConfig = {roles: ["KYT_SERVICE"], orgs: ["SC1"], minApprover: 1, timeoutInSeconds: 3600}
const coCtrlCfg: PolicyControlConfig = {roles: ["COMPLIANCE_OPS"], orgs: ["SC1"], minApprover: 1, timeoutInSeconds: 3600}

const kytPolCtrl: PolicyControl = {id: "KYT_CTRL-1", name: "KYT_CTRL", config: kytCtrlCfg}
const coPolCtrl: PolicyControl = {id: "CO_CTRL-1", name:"CO_CTRL", config: coCtrlCfg}
const kytCtrlGrp: PolicyControl = {id: "KYT_CTRL-GRP-1", name: "KYT_CTRL_GROUP", operand: "OR", left: kytPolCtrl, right: coPolCtrl}

const wlsPolCtrl: PolicyControl = {id: "WLS_CTRL-1", name: "WLS_CTRL", config: wlsCtrlCfg}
const wlsCtrlGrp: PolicyControl = {id: "WLS_CTRL-GRP-1", name: "WLS_CTRL_GROUP", operand: "OR", left: wlsPolCtrl, right: coPolCtrl}

const complianceCtrlGrp: PolicyControl = {id: "COMPLIANCE_CTRL-GRP-1", name: "COMPLIANCE_CTRL_GROUP", operand: "AND", left: kytCtrlGrp, right: wlsCtrlGrp}

const checkerPolCtrl: PolicyControl = {id: "CHECKER_CTRL-1", name: "CHECKER_CTRL", config: checkerCtrlCfg}
const transferOutPolCtrl: PolicyControl = {id: "TFOUT-CTRL-1", name: "TFOUT CONTROL", operand: "AND", left: checkerPolCtrl, right: complianceCtrlGrp}


const tftOutPolicyRule: PolicyRule = {
    id: "TFTO-1", name: "Transfer Out Rule", expression: "Number(ctx.wish.payload.amount) > 5000", enabled: true }
const tftOutPolicy: Policy = {
    id: "TFTO-POL-1", name: "Transfer Out Policy", orgId: corp.id, subOrgApplicability: false, wishKind: "TRANSFER_OUT", 
    ruleIds: [tftOutPolicyRule.id], controls: new Map([["TFTO-1", transferOutPolCtrl.id]]),enabled: true, dynamic: false, validFor: Number.MAX_VALUE}
//

const actorsMap = [tj, cj, co, wls, kyts].reduce((map, actor) => {
        map.set(actor.id, actor);
        return map;
      }, new Map<string, Actor>());

const policiesMap = [wishCreationPolicy, tftOutPolicy].reduce((map, policy) => {
    map.set(policy.id, policy);
    return map;
  }, new Map<string, Policy>());
      
const rulesMap = [wishCreationPolicyRule, tftOutPolicyRule].reduce((map, rule) => {
    map.set(rule.id, rule);
    return map;
  }, new Map<string, PolicyRule>());

  const controlsMap = [defaultControl, transferOutPolCtrl].reduce((map, control) => {
    map.set(control.id, control);
    return map;
  }, new Map<string, PolicyControl>());

const structure: OrgStructure = {
    orgs: new Map([[corp.id, corp]]), actors: actorsMap, policies: policiesMap, rules: rulesMap, controls: controlsMap} 

const myBTCWallet: Wallet = {id: "MyBTCWallet", orgId: corp.id, name: "BTC Trading Wallet", chain: "TESTNET"}
const wallets: Map<string, Wallet> = new Map([["MyBTCWallet", myBTCWallet]]); 

const transferOutPayload: TransferOutPayload = {fromWallet: "MyBTCWallet", toAddress: "0x123", amount: "5001"}
const tftOutWish: Wish = {id: "TFTO-1", actorId : tj.id, tgtOrgId: corp.id, kind: "TRANSFER_OUT", payload: transferOutPayload}

const pe: PolicyEngine = new PolicyEngine(structure)
structure.wallets = wallets;
pe.process(tftOutWish)