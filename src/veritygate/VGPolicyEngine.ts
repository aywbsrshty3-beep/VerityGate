import { Wish, Org, Actor, OrgStructure } from "./VGTypes";
import { DataStore } from "./VGStore";
import { array2map, toJSON } from "./VGUtils";
import { InMemoryDataStore } from "./VGMemoryStore";

/**
 * Policy Engine for VerityGate
 */
export class VGPolicyEngine {
  private store: DataStore;

  /**
   * @param store The data store
   */
  constructor(store: DataStore) {
    this.store = store;
  }

  /**
   * Builds the target organization structure context from the wish.
   * A wish has a tgtOrgId which is the target organization for the wish.
   * A wish also has an actorId which might be from a different organization.
   * All orgs and resulting policies and rules must be added to the context.
   * Included the wish itself - and optionally the wallet it applies to.
   */
  buildTargetOrgStruct(wish: Wish): OrgStructure {
    // console.log('Building Org Structure Context for Wish:', wish);
    // Get all organizations involved in the wish.
    const wish_orgs: Org[] = this.listOrgsHierarchy(wish.tgtOrgId);
    const wishMaker = this.store.getActorById(wish.actorId);
    if (!wishMaker) {
      throw new Error(`ErrorCode.ACTOR_UNKNOWN ${wish.actorId}`);
    }
    if (wishMaker.orgId !== wish.tgtOrgId) {
      if (!wishMaker.orgId) {
        throw new Error(`ErrorCode.ORG_UNKNOWN ${wishMaker.orgId}`);
      }
      const actorOrg = this.store.getOrgById(wishMaker.orgId);
      if (!actorOrg) {
        throw new Error(`ErrorCode.ORG_UNKNOWN ${wishMaker.orgId}`);
      }
      wish_orgs.push(actorOrg);
    }
    console.log(
      "Wish Organizations:",
      wish_orgs.map((org) => org.name).join(", ")
    );

    // Get all actors involved in the wish - Basically all actors from the organizations involved.
    const wish_actors: Actor[] = [];
    for (const org of wish_orgs) {
      if (!org) {
        continue;
      }
      const orgActors = this.store.getActorsByOrgId(org.id);
      for (const actor of orgActors) {
        wish_actors.push(actor);
      }
    }

    // Get alll policies from all the organizations involved in the wish.
    const wish_policies = [];
    for (const org of wish_orgs) {
      const orgPolicies = this.store.getPoliciesByOrgId(org.id);
      wish_policies.push(...orgPolicies);
    }

    // Get all policy rules from all the policies involved in the wish.
    const wish_policy_rules = [];
    for (const policy of wish_policies) {
      const policyRules = this.store.getPolicyRulesByPolicyId(policy.id);
      wish_policy_rules.push(...policyRules);
    }

    const wish_policy_controls = [];
    for (const policy of wish_policies) {
      const policyControls = this.store.getPolicyControlsByPolicyId(policy.id);
      wish_policy_controls.push(...policyControls);
    }

    // Get all wallets for the targeted orgs
    const wish_wallets = this.store.getWalletsByOrgId(wish.tgtOrgId);
    console.log(`WISH WALLETS ${array2map(wish_wallets)}`);

    // Build the org structure context
    const orgStructure: OrgStructure = {
      orgs: array2map(wish_orgs),
      actors: array2map(wish_actors),
      policies: array2map(wish_policies),
      policyRules: array2map(wish_policy_rules),
      policyControls: array2map(wish_policy_controls),
      wallets: array2map(wish_wallets),
      wish: wish,
    };
    // console.log("orgStructure", orgStructure)
    return orgStructure;
  } // buildTargetOrgStruct

  /**
   * Some specific wishes need to be enhanced.
   * A TRANSFER_OUT wish (See TransferOutPayload) has an amount native field (satoshi, wei, ..) and some policies will
   * work on the fiat equivalent of that amount. At some point we will need to augment the native amount with a amountUSD
   * @param wish The wish to process
   */
  process(wish: Wish): void {
    this.store.storeWish(wish);
    const orgStructure = this.buildTargetOrgStruct(wish);
    const orgStructureCtx = toJSON(orgStructure);
    console.log("Org Structure Context:", orgStructureCtx);

    // List all orgs from top to bottom
    const all_orgs: Org[] = this.listOrgsHierarchy(wish.tgtOrgId);
    console.log("all_orgs", all_orgs);

    // Look for applicable policies top down
    // We go from the top org - if no policy is found we go down the list
    // If no policy found at all - we fail
    console.log("For all policies...");
    let policy_found = false;
    let control_idx = 1; // to be replaced by an increasing database index. See VGControlHandler#processControls
    for (const org of all_orgs) {
      // For all orgs
      console.log(` processing org id ${org.id}`);
      const enabledPolicies = this.getEnabledPoliciesByOrgId(org.id);
      console.log(`Enabled policies for org ${org.name}:`, enabledPolicies);
      const matchingPolicies = enabledPolicies.filter(
        (policy) => policy.wishKind === wish.kind
      );
      console.log(`Matching policies for org ${org.name}:`, matchingPolicies);

      // Go through all policies and find the rules - if true store the controls
      console.log("for all potential policies...");
      for (const potential_policy of matchingPolicies) {
        // For all policies
        const rules = this.getEnabledRulesByPolicyId(potential_policy.id);
        console.log(`Matching rules for org ${org.name}:`, rules);

        let successful_eval = false;
        for (const potential_rule of rules) {
          // For all rules
          if (potential_rule.expression) {
            successful_eval = this.evaluate(
              potential_rule.expression,
              orgStructureCtx
            );
          } else {
            successful_eval = true;
          }

          if (successful_eval) {
            console.log(
              "[PE] Rule has fired. Storing the controls and moving on."
            );
            policy_found = true;
            // Found a matching policy and a rule that has fired for this org.
            // Storing Wish Id to Policy Id to Rule Id (From there the other process can get the control ids)
            this.store.storeControlStruct({
              index: control_idx,
              wishId: wish.id,
              policyId: potential_policy.id,
              ruleId: potential_rule.id,
            });
            control_idx = control_idx + 1;
            break;
            // The rule has fired. Store the controls and move on...
          }
        } // for each potential rule
        if (policy_found) {
          policy_found = false;
          break;
          // "One policy, one rule" rule
        }
      } // for each potential policy
    } // for each org

    // At this stage all controls are stored if successful
    // Another process will list the controls and executed the notifications one by one
    // Until full approval where the wish will be executed.
  } // process

  /**
   * Evaluates a JSON expression.
   * @param expression evaluates the expression against the context.
   * @returns true or false
   */
  evaluate(expression: string, structure: string): boolean {
    console.log(
      `[PE] evaluate expression ${expression} on structure ${structure}`
    );

    if (this.hasForbiddenKeywords(expression)) {
      console.error("[PE] Expression contains forbidden keywords");
      return false;
    }

    try {
      const expr = `
            const ctx = ${structure}; 
            ${expression}
        `;

      const res = eval(expr);
      console.log(" ", res);
      return res;
    } catch (error) {
      console.error("[PE] Error evaluating expression", error);
      return false;
    }
  }

  /**
   * Returns true if the input string contains forbidden keywords
   * @param input The string to search in
   */
  hasForbiddenKeywords(input: string): boolean {
    const bad_words = ["function", "call", "return", "eval", "=>", "async"];
    if (!input) return false;
    const lowerInput = input.toLowerCase();
    return bad_words.every((word) => lowerInput.includes(word.toLowerCase()));
  }

  /**
   * Returns all enabled rules for a given policy id.
   * A policy has an array of ruleIds.
   * @param policyId The policy ID
   * @returns Array of enabled policy rules
   */
  getEnabledRulesByPolicyId(policyId: string) {
    return this.store.getPolicyRulesByPolicyId(policyId);
  }

  /**
   * Returns all enabled policies for a given org id, ordered by highest priority (descending).
   * @param orgId The organization ID
   * @returns Array of enabled policies sorted by priority (highest first)
   */
  getEnabledPoliciesByOrgId(orgId: string) {
    const policies = this.store.getPoliciesByOrgId(orgId);
    return policies
      .filter((policy) => policy.enabled)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Lists all organizations in the hierarchy for the current target org,
   * starting from the top org (topOrgId) down to the target org.
   * @param tgtOrgId The target organization ID
   * @returns Org[] sorted from top to bottom
   */
  listOrgsHierarchy(tgtOrgId: string): Org[] {
    const orgs: Org[] = [];
    let currentOrg = this.store.getOrgById(tgtOrgId);
    while (currentOrg) {
      orgs.unshift(currentOrg);
      if (!currentOrg.topOrgId || currentOrg.topOrgId === currentOrg.id) {
        break;
      }
      currentOrg = this.store.getOrgById(currentOrg.topOrgId);
    }
    return orgs;
  }
}

// npx ts-node .\src\veritygate\VGPolicyEngine.ts
if (require.main === module) {
  // Example usage for manual testing
  // You would replace these with actual implementations and data
  const store = new InMemoryDataStore();
  store.bootstrap();
  // Example Wish object, replace with actual data as needed
  const exampleWish: Wish = {
    id: "wish1",
    tgtOrgId: "org1",
    actorId: "alice",
    // ...other Wish properties
  } as Wish;

  const engine = new VGPolicyEngine(store);
  try {
    engine.process(exampleWish);
  } catch (err) {
    console.error("Error processing wish:", err);
  }
}
