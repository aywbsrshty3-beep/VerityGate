/**
 * Bootstrap Creation Helper For Settlment Use Case
 */

import { Organisation, Actor, Policy, PolicyRule, PolicyControl, PolicyControlConfig } from '../../investigations/gel/types';
import { genId } from '../pe/HadesUtils';
import { openConnection, insertData } from '../pe/HadesDB';

async function setUpData(): Promise<void> {
  const dbClient = await openConnection()

  // ORGS & ACTORS
  const org1: Organisation = { id: "ORG1", name: "ORG1", enabled: true }
  console.log("org1:", JSON.stringify(org1))
  insertData(dbClient, "hades.organization", { id: org1.id, payload: JSON.stringify(org1) })
  const makerOrg1: Actor = { id: "MAKER_ORG1", name: "MAKER_ORG1", role: "MAKER", orgId: org1.id, enabled: true }
  const checkerOrg1: Actor = { id: "CHECKER_ORG1", name: "CHECKER_ORG1", role: "CHECKER", orgId: org1.id, enabled: true }
  insertData(dbClient, "hades.actor", { id: makerOrg1.id, payload: JSON.stringify(makerOrg1) })
  insertData(dbClient, "hades.actor", { id: checkerOrg1.id, payload: JSON.stringify(checkerOrg1) })

  const org2: Organisation = { id: "ORG2", name: "ORG2", enabled: true }
  console.log("org2:", JSON.stringify(org2))
  insertData(dbClient, "hades.organization", { id: org2.id, payload: JSON.stringify(org2) })
  const makerOrg2: Actor = { id: "MAKER_ORG2", name: "MAKER_ORG2", role: "MAKER", orgId: org2.id, enabled: true }
  const checkerOrg2: Actor = { id: "CHECKER_ORG2", name: "CHECKER_ORG2", role: "CHECKER", orgId: org2.id, enabled: true }
  insertData(dbClient, "hades.actor", { id: makerOrg2.id, payload: JSON.stringify(makerOrg2) })
  insertData(dbClient, "hades.actor", { id: checkerOrg2.id, payload: JSON.stringify(checkerOrg2) })

  const exchange: Organisation = { id: "EXC", name: "EXC", enabled: true }
  console.log("exchange:", JSON.stringify(exchange))
  insertData(dbClient, "hades.organization", { id: exchange.id, payload: JSON.stringify(exchange) })
  const makerExc: Actor = { id: "MAKER_EXC", name: "MAKER_EXC", role: "MAKER", orgId: exchange.id, enabled: true }
  const checkerExc: Actor = { id: "CHECKER_EXC", name: "CHECKER_EXC", role: "CHECKER", orgId: exchange.id, enabled: true }
  insertData(dbClient, "hades.actor", { id: makerExc.id, payload: JSON.stringify(makerExc) })
  insertData(dbClient, "hades.actor", { id: checkerExc.id, payload: JSON.stringify(checkerExc) })

  const hss: Organisation = { id: "HSS", name: "HSS", enabled: true }
  console.log("hss:", JSON.stringify(hss))
  insertData(dbClient, "hades.organization", { id: hss.id, payload: JSON.stringify(hss) })
  const makerHSS: Actor = { id: "MAKER_HSS", name: "MAKER_HSS", role: "MAKER", orgId: hss.id, enabled: true }
  const checkerHSS: Actor = { id: "CHECKER_HSS", name: "CHECKER_HSS", role: "CHECKER", orgId: hss.id, enabled: true }
  insertData(dbClient, "hades.actor", { id: makerHSS.id, payload: JSON.stringify(makerHSS) })
  insertData(dbClient, "hades.actor", { id: checkerHSS.id, payload: JSON.stringify(checkerHSS) })

  // WISHES
  // - ORGS can create wishes for everything within ORG: "ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === 'MAKER'"
  const orgWishCreationRule: PolicyRule = {
    id: genId("org-wish-rule"), name: "Org Wish Creation Rule", enabled: true,
    expression: "ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId && ctx.actors[ctx.wish.actorId].role === 'MAKER'"
  }
  insertData(dbClient, "hades.policyrule", { id: orgWishCreationRule.id, payload: JSON.stringify(orgWishCreationRule) })
  const org1WishCreationPolicy: Policy = {
    id: genId("org1-wish-pol"), name: "Org1 Wish Creation Policy", orgId: org1.id, subOrgApplicability: false, wishKind: "WISH_CREATION",
    ruleIds: [orgWishCreationRule.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: org1WishCreationPolicy.id, payload: JSON.stringify(org1WishCreationPolicy) })
  const org2WishCreationPolicy: Policy = {
    id: genId("org2-wish-pol"), name: "Org2 Wish Creation Policy", orgId: org2.id, subOrgApplicability: false, wishKind: "WISH_CREATION",
    ruleIds: [orgWishCreationRule.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: org2WishCreationPolicy.id, payload: JSON.stringify(org2WishCreationPolicy) })

  // - HSS can create wishes for transfer out on settlement wallets only as makers within ORG
  const hssWishCreationRule1: PolicyRule = {
    id: genId("hss-wish-rule-org1"), name: "HSS Wish Creation Rule", enabled: true,
    expression: 
    `
    ctx.actors[ctx.wish.actorId].orgId === 'HSS' &&
    ctx.wish.tgtOrgId === 'ORG1' &&
    ctx.wish.kind === 'TRANSFER_OUT' &&
    ctx.wallets[ctx.wish.payload.fromWallet].meta['TYPE'] === 'SETTLEMENT' &&
    ctx.actors[ctx.wish.actorId].role === 'MAKER'
    `
  }
  insertData(dbClient, "hades.policyrule", { id: hssWishCreationRule1.id, payload: JSON.stringify(hssWishCreationRule1) })
  const hssWishCreationPolicy1: Policy = {
    id: genId("hss-wish-pol-1"), name: "HSS Wish Creation Policy", orgId: org1.id, subOrgApplicability: false, wishKind: "WISH_CREATION",
    ruleIds: [hssWishCreationRule1.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: hssWishCreationPolicy1.id, payload: JSON.stringify(hssWishCreationPolicy1) })

  const hssWishCreationRule2: PolicyRule = {
    id: genId("hss-wish-rule-org2"), name: "HSS Wish Creation Rule", enabled: true,
    expression: 
    `
    ctx.actors[ctx.wish.actorId].orgId === 'HSS' &&
    ctx.wish.tgtOrgId === 'ORG2' &&
    ctx.wish.kind === 'TRANSFER_OUT' &&
    ctx.wallets[ctx.wish.payload.fromWallet].meta['TYPE'] === 'SETTLEMENT' &&
    ctx.actors[ctx.wish.actorId].role === 'MAKER'
    `
  }
  insertData(dbClient, "hades.policyrule", { id: hssWishCreationRule2.id, payload: JSON.stringify(hssWishCreationRule2) })
  const hssWishCreationPolicy2: Policy = {
    id: genId("hss-wish-pol-2"), name: "HSS Wish Creation Policy", orgId: org2.id, subOrgApplicability: false, wishKind: "WISH_CREATION",
    ruleIds: [hssWishCreationRule2.id], controls: new Map(), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: hssWishCreationPolicy2.id, payload: JSON.stringify(hssWishCreationPolicy2) })
  

  // Last element required for the bootstrap is the ability to create new policies for wallet creation and transfers...
  const org1PolicyCreationControlConfig: PolicyControlConfig = { roles: ["CHECKER"], orgs: [org1.id], minApprover: 1, timeoutInSeconds: 3600 }
  const org1PolicyCreationControl: PolicyControl = { id: genId("org1-create-pol-ctrl"), name: "Create Policy Control", config: org1PolicyCreationControlConfig }
  const orgPolicyCreationRule: PolicyRule = { id: genId("org-create-pol-rule"), name: "Create Policy Rule", enabled: true}
  const org1PolicyCreationPolicy: Policy = {
    id: genId("org1-create-pol"), name: "Create Policy Policy", orgId: org1.id, subOrgApplicability: false, wishKind: "CREATE_POLICY",
    ruleIds: [orgPolicyCreationRule.id], controls: new Map([[orgPolicyCreationRule.id, org1PolicyCreationControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: org1PolicyCreationPolicy.id, payload: JSON.stringify(org1PolicyCreationPolicy) })
  insertData(dbClient, "hades.policyrule", { id: orgPolicyCreationRule.id, payload: JSON.stringify(orgPolicyCreationRule) })
  insertData(dbClient, "hades.policycontrol", { id: org1PolicyCreationControl.id, payload: JSON.stringify(org1PolicyCreationControl) })

  const org2PolicyCreationControlConfig: PolicyControlConfig = { roles: ["CHECKER"], orgs: [org2.id], minApprover: 1, timeoutInSeconds: 3600 }
  const org2PolicyCreationControl: PolicyControl = { id: genId("org2-create-pol-ctrl"), name: "Create Policy Control", config: org2PolicyCreationControlConfig }
  const org2PolicyCreationPolicy: Policy = {
    id: genId("org2-create-pol"), name: "Create Policy Policy", orgId: org2.id, subOrgApplicability: false, wishKind: "CREATE_POLICY",
    ruleIds: [orgPolicyCreationRule.id], controls: new Map([[orgPolicyCreationRule.id, org2PolicyCreationControl.id]]), enabled: true, dynamic: false, validFor: Number.MAX_VALUE
  }
  insertData(dbClient, "hades.policy", { id: org2PolicyCreationPolicy.id, payload: JSON.stringify(org2PolicyCreationPolicy) })
  insertData(dbClient, "hades.policycontrol", { id: org2PolicyCreationControl.id, payload: JSON.stringify(org2PolicyCreationControl) })

  // Create a control for checker (EXC) to approve the transfer out
  const excTransferOutControlConfig: PolicyControlConfig = { roles: ["CHECKER"], orgs: [exchange.id], minApprover: 1, timeoutInSeconds: 3600 }  
  const excTransferOutPolicy: PolicyControl = { id: genId("exc-tft-pol"), name: "Tft Out Control", config: excTransferOutControlConfig }
  insertData(dbClient, "hades.policycontrol", { id: excTransferOutPolicy.id, payload: JSON.stringify(excTransferOutPolicy) })

  // Finally, there is a link between ORG1/ORG2 and EXC/HSS for transfers
  // This is useful to build the internal json structure for policy evaluation
  insertData(dbClient, "hades.linkedOrgs", { id: org1.id, linkedId: exchange.id })
  insertData(dbClient, "hades.linkedOrgs", { id: org1.id, linkedId: hss.id })
  insertData(dbClient, "hades.linkedOrgs", { id: org2.id, linkedId: exchange.id })
  insertData(dbClient, "hades.linkedOrgs", { id: org2.id, linkedId: hss.id })
}

setUpData();

setTimeout(() => {
  console.log("Aurevoir...");
  process.exit(0);
}, 5000);
