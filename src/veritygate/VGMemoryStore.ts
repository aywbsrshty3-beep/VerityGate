import {
  Org,
  Actor,
  Wish,
  PolicyControl,
  PolicyRule,
  Policy,
  Wallet,
  ControlStructure,
} from "../veritygate/VGTypes";
import { DataStore } from "./VGStore";

export class InMemoryDataStore extends DataStore {
  private orgs: Map<string, Org> = new Map();
  private actors: Map<string, Actor> = new Map();
  private wishes: Map<string, Wish> = new Map();
  private policyControls: Map<string, PolicyControl> = new Map();
  private policyRules: Map<string, PolicyRule> = new Map();
  private policies: Map<string, Policy> = new Map();
  private wallets: Map<String, Wallet> = new Map();
  private controlStruct: Map<[string, number], ControlStructure> = new Map();

  bootstrap(): void {
    console.log(
      "[InMemoryDataStore] Bootstrapping data store with minimal data set"
    );

    this.orgs.set("topOrg", {
      id: "topOrg",
      name: "My Top Organization",
      enabled: true,
    });

    this.orgs.set("org1", {
      id: "org1",
      name: "My Organization",
      topOrgId: "topOrg",
      enabled: true,
    });

    this.actors.set("alice", {
      id: "alice",
      name: "Alice",
      role: "Maker",
      orgId: "org1",
      enabled: true,
    });

    this.actors.set("bob", {
      id: "bob",
      name: "Bob",
      role: "Checker",
      orgId: "org1",
      enabled: true,
    });

    this.wallets.set("eth-wallet-0", {
      id: "eth-wallet-0",
      orgId: "org1",
      name: "My ETH Wallet",
      chain: "SEPOLIA",
      provider: "THALES",
    });

    const policyControl: PolicyControl = {
      id: "create-policy-control-id-1",
      name: "Create Policy Control",
      roles: ["Checker"],
      orgs: ["org1"],
      minApprovers: [1],
      timeoutInSeconds: 300,
    };

    this.policyControls.set(policyControl.id, policyControl);

    const policyRule: PolicyRule = {
      id: "create-policy-rule-id-1",
      name: "Create Policy Rule",
      enabled: true,
    };

    this.policyRules.set(policyRule.id, policyRule);

    const createPolicyPolicy: Policy = {
      id: "create-policy-id-1",
      name: "Create Policy",
      orgId: "org1",
      subOrgApplicability: false,
      wishKind: "CREATE_POLICY",
      ruleIds: [policyRule.id],
      controls: new Map([[policyRule.id, policyControl.id]]),
      priority: 0,
      enabled: true,
      dynamic: false,
      createdAt: Date.now(),
    };

    this.policies.set(createPolicyPolicy.id, createPolicyPolicy);

    const createWalletPolicy: Policy = {
      id: "create-wallet-id-1",
      name: "Create Wallet Policy",
      orgId: "org1",
      subOrgApplicability: false,
      wishKind: "CREATE_WALLET",
      ruleIds: [policyRule.id],
      controls: new Map([[policyRule.id, policyControl.id]]),
      priority: 0,
      enabled: true,
      dynamic: false,
      createdAt: Date.now(),
    };

    this.policies.set(createWalletPolicy.id, createWalletPolicy);
  }

  storeWish(wish: Wish): void {
    this.wishes.set(wish.id, wish);
  }

  storeControlStruct(cs: ControlStructure) {
    this.controlStruct.set([cs.wishId, cs.index], cs);
  }

  getActorById(id: string): Actor | undefined {
    const actor = this.actors.get(id);
    return actor && actor.enabled ? actor : undefined;
  }

  getOrgById(id: string): Org | undefined {
    const org = this.orgs.get(id);
    return org && org.enabled ? org : undefined;
  }

  getActorsByOrgId(orgId: string): Actor[] {
    return Array.from(this.actors.values()).filter(
      (actor) => actor.orgId === orgId && actor.enabled
    );
  }

  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values()).filter(
      (policy) => policy.enabled
    );
  }

  getPoliciesByOrgId(orgId: string): Policy[] {
    return Array.from(this.policies.values()).filter(
      (policy) => policy.orgId === orgId && policy.enabled
    );
  }

  getAllPolicyRules(): PolicyRule[] {
    return Array.from(this.policyRules.values()).filter((rule) => rule.enabled);
  }

  getPolicyRulesByPolicyId(policyId: string): PolicyRule[] {
    const policy = this.policies.get(policyId);
    if (!policy || !policy.enabled || !Array.isArray(policy.ruleIds)) {
      return [];
    }
    return policy.ruleIds
      .map((ruleId) => this.policyRules.get(ruleId))
      .filter((rule): rule is PolicyRule => !!rule && rule.enabled);
  }

  getPolicyControlsByPolicyId(policyId: string): PolicyControl[] {
    const policy = this.policies.get(policyId);
    if (!policy || !policy.enabled || !(policy.controls instanceof Map)) {
      return [];
    }
    const controlIds = Array.from(policy.controls.values());
    return controlIds
      .map((controlId) => this.policyControls.get(controlId))
      .filter((control): control is PolicyControl => !!control);
  }

  getWalletsByOrgId(orgId: string): Wallet[] {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.orgId === orgId
    );
  }
}
