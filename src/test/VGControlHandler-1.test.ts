import { InMemoryDataStore } from "../veritygate/VGMemoryStore";
import { VGControlHandler } from "../veritygate/VGControlHandler";

import { expect } from "chai";

/**
 * Basic test to process a wish
 * npm run test
 */
describe("Policy Engine 1", () => {
  let dataStore: InMemoryDataStore;
  let controlHandler: VGControlHandler;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    controlHandler = new VGControlHandler(dataStore);
  });

  describe("bootstrap", () => {
    beforeEach(() => {
      dataStore.bootstrap();
    });

    it("should build a json context for a wish", () => {
      // // @ts-ignore: Accessing private property for test purposes
      // const createWalletPayload: CreateWalletPayload = {
      //   name: "My BTC Wallet",
      //   chain: "BTC-MAIN-NET",
      // };
      // const createWalletWish: Wish = {
      //   id: "create-wallet-policy-wish",
      //   actorId: "alice",
      //   tgtOrgId: "org1",
      //   kind: "WALLET_CREATION",
      //   payload: createWalletPayload,
      // };

      // const orgStructure: OrgStructure =
      //   policyEngine.buildTargetOrgStruct(createWalletWish);
      // expect(orgStructure).to.be.an("object");
    });

  
  });
});
