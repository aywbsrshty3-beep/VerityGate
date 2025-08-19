import { InMemoryDataStore } from "../veritygate/VGMemoryStore";
import { Org, Actor } from "../veritygate/VGTypes";

import { expect } from "chai";

// npm run test
describe("InMemoryDataStore", () => {
  let dataStore: InMemoryDataStore;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
  });

  describe("bootstrap", () => {
    beforeEach(() => {
      dataStore.bootstrap();
    });

    it("should add the default organization", () => {
      // @ts-ignore: Accessing private property for test purposes
      const orgs: Map<string, Org> = dataStore["orgs"];
      expect(orgs.has("org1")).to.be.true;
      const org = orgs.get("org1");
      expect(org).to.deep.equal({
        id: "org1",
        name: "My Organization",
        topOrgId: "topOrg",
        enabled: true,
      });
    });

    it("should add Alice as an actor", () => {
      // @ts-ignore: Accessing private property for test purposes
      const actors: Map<string, Actor> = dataStore["actors"];
      expect(actors.has("alice")).to.be.true;
      const alice = actors.get("alice");
      expect(alice).to.deep.equal({
        id: "alice",
        name: "Alice",
        role: "Maker",
        orgId: "org1",
        enabled: true,
      });
    });

    it("should add Bob as an actor", () => {
      // @ts-ignore: Accessing private property for test purposes
      const actors: Map<string, Actor> = dataStore["actors"];
      expect(actors.has("bob")).to.be.true;
      const bob = actors.get("bob");
      expect(bob).to.deep.equal({
        id: "bob",
        name: "Bob",
        role: "Checker",
        orgId: "org1",
        enabled: true,
      });
    });
  });
});
