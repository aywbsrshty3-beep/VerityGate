import { InMemoryDataStore } from "../veritygate/VGMemoryStore";
import { VGPolicyEngine } from "../veritygate/VGPolicyEngine";
import {
  PolicyControl,
  PolicyRule,
  Policy,
  Wish,
  ControlStructure,
} from "../veritygate/VGTypes";
import { TransferOutPayload } from "../veritygate/VGPayloads";

import { expect } from "chai";

/**
 * Basic test to process a wish with a simple rule evaluation
 * npm run test
 */
describe("Policy Engine 2", () => {
  let dataStore: InMemoryDataStore;
  let policyEngine: VGPolicyEngine;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    policyEngine = new VGPolicyEngine(dataStore);
  });

  describe("bootstrap", () => {
    beforeEach(() => {
      // @ts-ignore: Accessing private property for test purposes
      dataStore.orgs.set("org1", {
        id: "org1",
        name: "My Org 1",
        enabled: true,
      });
      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("alice", {
        id: "alice",
        name: "Alice",
        role: "Maker",
        orgId: "org1",
        enabled: true,
      });
      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("bob", {
        id: "bob",
        name: "Bob",
        role: "Checker",
        orgId: "org1",
        enabled: true,
      });

      // @ts-ignore: Accessing private property for test purposes
      dataStore.wallets.set("btc-wallet-1", {
        id: "btc-wallet-1",
        orgId: "org1",
        name: "My BTC Wallet",
        chain: "TESTNET",
        provider: "DFNS",
      });
      const policyControl: PolicyControl = {
        id: "create-policy-control-id-1",
        name: "Create Policy Control",
        roles: ["Checker"],
        orgs: ["org1"],
        minApprovers: [1],
        timeoutInSeconds: 300,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyControls.set(policyControl.id, policyControl);

      const policyRule: PolicyRule = {
        id: "create-policy-rule-id-1",
        name: "Create Policy Rule",
        expression: "ctx.wish.payload.amount <= 100",
        enabled: true,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyRules.set(policyRule.id, policyRule);

      const createPolicyPolicy: Policy = {
        id: "create-policy-id-1",
        name: "Create Policy",
        orgId: "org1",
        subOrgApplicability: false,
        wishKind: "TRANSFER_OUT",
        ruleIds: [policyRule.id],
        controls: new Map([[policyRule.id, policyControl.id]]),
        priority: 0,
        enabled: true,
        dynamic: false,
        createdAt: Date.now(),
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policies.set(createPolicyPolicy.id, createPolicyPolicy);
    });

    it("Should allow transfer out if below a specific notional", () => {
      // @ts-ignore: Accessing private property for test purposes
      const transferOutPayload: TransferOutPayload = {
        fromWallet: "FromWalletId1",
        toWallet: "ToWalletId2",
        amount: "90",
      };

      const transferWish: Wish = {
        id: "create-tft-out-wish-1",
        actorId: "alice",
        tgtOrgId: "org1",
        kind: "TRANSFER_OUT",
        payload: transferOutPayload,
      };

      policyEngine.process(transferWish);

      // @ts-ignore: Accessing private property for test purposes
      const csValues = Array.from(dataStore.controlStruct.values());
      expect(csValues.length).to.equal(1);
      const csValue: ControlStructure = csValues[0];
      expect(csValue).to.deep.equal({
        index: 1,
        wishId: "create-tft-out-wish-1",
        policyId: "create-policy-id-1",
        ruleId: "create-policy-rule-id-1",
      });
    });
  });
});
