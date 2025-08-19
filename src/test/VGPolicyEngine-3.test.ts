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
 * A more complex test where two policies are implemented: a compliance policy at the top - and a transfer out policy at the target org.
 * Ie, for TRANSFER_OUT, the top org requires Compliance approval, the target org is just a normal policy with an amount.
 *
 * npm run test
 */
describe("Policy Engine 3", () => {
  let dataStore: InMemoryDataStore;
  let policyEngine: VGPolicyEngine;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    policyEngine = new VGPolicyEngine(dataStore);
  });

  describe("bootstrap", () => {
    beforeEach(() => {
      // @ts-ignore: Accessing private property for test purposes
      dataStore.orgs.set("SocGen", {
        id: "SocGen",
        name: "Societe Generale",
        enabled: true,
      });
      // @ts-ignore: Accessing private property for test purposes
      dataStore.orgs.set("Forge", {
        id: "Forge",
        name: "Forge",
        enabled: true,
        topOrgId: "SocGen",
      });

      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("alice", {
        id: "alice",
        name: "Alice",
        role: "Maker",
        orgId: "SocGen",
        enabled: true,
      });
      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("bob", {
        id: "bob",
        name: "Bob",
        role: "Checker",
        orgId: "SocGen",
        enabled: true,
      });

      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("dave", {
        id: "dave",
        name: "Dave",
        role: "Maker",
        orgId: "Forge",
        enabled: true,
      });
      // @ts-ignore: Accessing private property for test purposes
      dataStore.actors.set("carol", {
        id: "carol",
        name: "Carol",
        role: "Checker",
        orgId: "Forge",
        enabled: true,
      });

      // @ts-ignore: Accessing private property for test purposes
      dataStore.wallets.set("forge-btc-wallet", {
        id: "forge-btc-wallet",
        orgId: "Forge",
        name: "BTC Settlement Wallet",
        chain: "TESTNET",
        provider: "DFNS",
      });

      const topOrgpolicyControl: PolicyControl = {
        id: "topOrgComplianceControl-1",
        name: "Transfer Compliance Control",
        roles: ["Checker"],
        orgs: ["SocGen"],
        minApprovers: [1],
        timeoutInSeconds: 300,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyControls.set(topOrgpolicyControl.id, topOrgpolicyControl);

      const topOrgpolicyRule: PolicyRule = {
        id: "topOrgComplianceRule-1",
        name: "Transfer Compliance Rule",
        enabled: true,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyRules.set(topOrgpolicyRule.id, topOrgpolicyRule);

      const topOrgPolicy: Policy = {
        id: "topOrgPolicy-1",
        name: "Top Org Transfer Compliance Policy",
        orgId: "SocGen",
        subOrgApplicability: false,
        wishKind: "TRANSFER_OUT",
        ruleIds: [topOrgpolicyRule.id],
        controls: new Map([[topOrgpolicyRule.id, topOrgpolicyControl.id]]),
        priority: 0,
        enabled: true,
        dynamic: false,
        createdAt: Date.now(),
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policies.set(topOrgPolicy.id, topOrgPolicy);

      const subPolicyControl: PolicyControl = {
        id: "subTransferContro-1",
        name: "Sub Transfer Control",
        roles: ["Checker"],
        orgs: ["Forge"],
        minApprovers: [1],
        timeoutInSeconds: 300,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyControls.set(subPolicyControl.id, subPolicyControl);

      const subPolicyRule: PolicyRule = {
        id: "subPolicyRule",
        name: "Sub Transfer Policy Rule",
        expression: "ctx.wish.payload.amount <= 100",
        enabled: true,
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policyRules.set(subPolicyRule.id, subPolicyRule);

      const subTransferPolicy: Policy = {
        id: "sub-transfer-policy-1",
        name: "Sub Transfer Policy",
        orgId: "Forge",
        subOrgApplicability: false,
        wishKind: "TRANSFER_OUT",
        ruleIds: [subPolicyRule.id],
        controls: new Map([[subPolicyRule.id, subPolicyControl.id]]),
        priority: 0,
        enabled: true,
        dynamic: false,
        createdAt: Date.now(),
      };
      // @ts-ignore: Accessing private property for test purposes
      dataStore.policies.set(subTransferPolicy.id, subTransferPolicy);
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
        actorId: "carol",
        tgtOrgId: "Forge",
        kind: "TRANSFER_OUT",
        payload: transferOutPayload,
      };

      policyEngine.process(transferWish);

      // @ts-ignore: Accessing private property for test purposes
      const csValues = Array.from(dataStore.controlStruct.values());
      expect(csValues.length).to.equal(2);

      const csValue1: ControlStructure = csValues[0];
      expect(csValue1).to.deep.equal({
        index: 1,
        wishId: "create-tft-out-wish-1",
        policyId: "topOrgPolicy-1",
        ruleId: "topOrgComplianceRule-1",
      });

      const csValue2: ControlStructure = csValues[1];
      expect(csValue2).to.deep.equal({
        index: 2,
        wishId: "create-tft-out-wish-1",
        policyId: "sub-transfer-policy-1",
        ruleId: "subPolicyRule",
      });
    });
  });
});
