import {
  Org,
  Actor,
  Wish,
  PolicyControl,
  PolicyRule,
  Policy,
  Wallet,
} from "../veritygate/VGTypes";

// npx ts-node .\code\src\educ\walkthrough.ts

const org: Org = {
  id: "org1",
  name: "My Organization",
  enabled: true,
};
console.log(JSON.stringify(org, null, 2));

const maker: Actor = {
  id: "alice",
  name: "Alice",
  role: "Maker",
  orgId: org.id,
  enabled: true,
};
console.log(JSON.stringify(maker, null, 2));

const checker: Actor = {
  id: "bob",
  name: "Bob",
  role: "Checker",
  orgId: org.id,
  enabled: true,
};
console.log(JSON.stringify(checker, null, 2));

const createWalletPayload: Wallet = {
  id: "BTC-WALLET-ONE",
  name: "My BTC Wallet",
  chain: "BTC-MAIN-NET",
  orgId: org.id,
};

const createWalletWish: Wish = {
  id: "create-wallet-policy-wish",
  actorId: maker.id,
  tgtOrgId: org.id,
  kind: "WALLET_CREATION",
  payload: createWalletPayload,
};

console.log(JSON.stringify(createWalletWish, null, 2));

const policyControl: PolicyControl = {
  id: "create-policy-control-id-1",
  name: "Create Policy Control",
  roles: ["Checker"],
  orgs: [org.id],
  minApprovers: [1],
  timeoutInSeconds: 300,
};

console.log(JSON.stringify(policyControl, null, 2));

const policyRule: PolicyRule = {
  id: "create-policy-rule-id-1",
  name: "Create Policy Rule",
  enabled: true,
};

console.log(JSON.stringify(policyRule, null, 2));

const createPolicyPolicy: Policy = {
  id: "create-policy-id-1",
  name: "Create Policy",
  orgId: org.id,
  subOrgApplicability: false,
  wishKind: "CREATE_POLICY",
  ruleIds: [policyRule.id],
  controls: new Map([[policyRule.id, policyControl.id]]),
  priority: 1,
  enabled: true,
  dynamic: false,
  createdAt: Date.now(),
};

function toJSON(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Map) {
      // Convert Map to an array of [key, value] pairs
      return Array.from(value.entries());
    }
    return value; // For other types, return the value as is
  });
}

console.log(toJSON(createPolicyPolicy));

const sp1: PolicyControl = {
  id: "create-policy-control-id-1",
  name: "Simple Policy Control",
  roles: ["Checker"],
  orgs: [org.id],
  minApprovers: [1],
  timeoutInSeconds: 300,
};
console.log(toJSON(sp1));

const sp2: PolicyControl = {
  id: "policy-control-id-2",
  name: "Risk & Compliance Policy Control",
  roles: ["ComplianceChecker", "RiskChecker"],
  orgs: ["OrgOne", "OrgOne"],
  minApprovers: [1, 1],
  timeoutInSeconds: 300,
};
console.log(toJSON(sp2));

const sp3: PolicyControl = {
  id: "policy-control-id-3",
  name: "3 groups",
  roles: ["Group1Checker", "Group2Checker", "Group3Checker"],
  orgs: ["OrgOne", "OrgOne", "OrgOne"],
  minApprovers: [1, 1, 2],
  condition: "($0 && $1) || $3",
  timeoutInSeconds: 300,
};
console.log(toJSON(sp3));

const sp4: PolicyControl = {
  id: "policy-dual-control-1",
  name: "Dual Control",
  roles: ["Checker", "Checker"],
  orgs: ["OrgOne", "OrgTwo"],
  minApprovers: [1, 1],
  timeoutInSeconds: 300,
};
console.log(toJSON(sp4));