import {
  Wish,
  Actor,
  Org,
  Policy,
  PolicyRule,
  PolicyControl,
  Wallet,
  ControlStructure,
} from "./VGTypes";

export abstract class DataStore {
  /**
   * Loads default data into the store.
   */
  abstract bootstrap(): void;

  /**
   * Stores a wish in the data store.
   * @param wish The wish to store
   */
  abstract storeWish(wish: Wish): void;

  /**
   * Stores the control structure
   * @param cs
   */
  abstract storeControlStruct(cs: ControlStructure): void;

  /**
   * Retrieves an actor by their ID.
   * @param id The ID of the actor to retrieve
   */
  abstract getActorById(id: string): Actor | undefined;

  /**
   * Retrieves an organization by its ID.
   * @param id The ID of the organization to retrieve
   */
  abstract getOrgById(id: string): Org | undefined;

  /**
   * Retrieves all actors associated with a specific organization ID.
   * @param orgId The ID of the organization whose actors are to be retrieved
   */
  abstract getActorsByOrgId(orgId: string): Actor[];

  /**
   * Retrieves all policies in the data store.
   * @returns An array of all policies
   */
  abstract getAllPolicies(): Policy[];

  /**
   * Retrieves all policies associated with a specific organization ID.
   * @param orgId The ID of the organization whose policies are to be retrieved
   * @returns An array of policies associated with the specified organization ID
   */
  abstract getPoliciesByOrgId(orgId: string): Policy[];

  /**
   * Retrieves all policy rules in the data store.
   * @returns An array of all policy rules
   */
  abstract getAllPolicyRules(): PolicyRule[];

  /**
   * Retrieves all policy rules associated with a specific policy ID.
   * @param policyId The ID of the policy whose rules are to be retrieved
   * @returns An array of policy rules associated with the specified policy ID
   */
  abstract getPolicyRulesByPolicyId(policyId: string): PolicyRule[];

  /**
   *
   * @param policyId The ID of the policy whose controls are to be retrieved
   * @returns An array of policy controls associated with the specified policy ID
   */
  abstract getPolicyControlsByPolicyId(policyId: string): PolicyControl[];

  /**
   * @param orgId The ID of the organization
   * @param orgId
   */
  abstract getWalletsByOrgId(orgId: string): Wallet[];
}
