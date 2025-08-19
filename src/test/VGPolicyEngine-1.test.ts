import { InMemoryDataStore } from "../veritygate/VGMemoryStore";
import { VGPolicyEngine } from "../veritygate/VGPolicyEngine";
import { Wish, Wallet, OrgStructure } from "../veritygate/VGTypes";

import { expect } from "chai";

/**
 * Basic test to process a wish
 * npm run test
 */
describe("Policy Engine 1", () => {
  let dataStore: InMemoryDataStore;
  let policyEngine: VGPolicyEngine;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    policyEngine = new VGPolicyEngine(dataStore);
  });

  describe("bootstrap", () => {
    beforeEach(() => {
      dataStore.bootstrap();
    });

    it("should build a json context for a wish", () => {
      // @ts-ignore: Accessing private property for test purposes
      const createWalletPayload: CreateWalletPayload = {
        name: "My BTC Wallet",
        chain: "BTC-MAIN-NET",
      };
      const createWalletWish: Wish = {
        id: "create-wallet-policy-wish",
        actorId: "alice",
        tgtOrgId: "org1",
        kind: "WALLET_CREATION",
        payload: createWalletPayload,
      };

      const orgStructure: OrgStructure =
        policyEngine.buildTargetOrgStruct(createWalletWish);
      expect(orgStructure).to.be.an("object");
    });

    it("should process a simple wish", () => {
      // @ts-ignore: Accessing private property for test purposes
      const createWalletPayload: Wallet = {
        id: "BTC-WALLET-ONE",
        name: "My BTC Wallet",
        chain: "BTC-MAIN-NET",
        orgId: "org1",
      };
      const createWalletWish: Wish = {
        id: "create-wallet-policy-wish",
        actorId: "alice",
        tgtOrgId: "org1",
        kind: "CREATE_WALLET",
        payload: createWalletPayload,
      };

      policyEngine.process(createWalletWish);
    });
  });
});
