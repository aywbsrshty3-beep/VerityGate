/**
 * Identifiable interface
 * This interface defines a type that has a unique identifier.
 */
export interface Identifiable {
  id: string;
}

/**
 * Org interface
 * This interface defines the structure of an organization (or domain).
 */
export interface Org extends Identifiable {
  topOrgId?: string;
  name: string;
  meta?: Map<string, string | number>;
  enabled: boolean;
}

/**
 * Actor interface
 * This interface defines the structure of an actor within an organization.
 */
export interface Actor extends Identifiable {
  name: string;
  role: string;
  orgId: string;
  meta?: Map<string, string | number>;
  publicKey?: string;
  enabled: boolean;
}

/**
 * Wish interface
 * This interface defines the structure of a wish, which is a request or intent made by an actor.
 */
export interface Wish extends Identifiable {
  actorId: string;
  tgtOrgId: string;
  kind: string;
  meta?: Map<string, string | number>; // Can contain legs and settlementId
  payload: any;
}

export interface WishPayload {
  wish: Wish;
  signature: string; // base64-encoded signature
}

/**
 * Policy interface
 */
export interface Policy extends Identifiable {
  name: string;
  orgId: string;
  subOrgApplicability: boolean;
  wishKind: string;
  ruleIds: string[];
  controls: Map<string, string>;
  enabled: boolean;
  priority: number;
  dynamic?: boolean;
  createdAt?: number;
  validFor?: number;
}

/**
 * PolicyRule interface
 * This interface defines the structure of a policy rule, which is a condition that must be met
 */
export interface PolicyRule extends Identifiable {
  name: string;
  expression?: string;
  enabled: boolean;
}

/**
 * PolicyControl is a simple structure allowing complex auth matrices.
 */
export interface PolicyControl extends Identifiable {
  id: string;
  name: string;
  roles: string[];
  orgs: string[];
  minApprovers: number[];
  condition?: string;
  timeoutInSeconds: number;
}

/**
 * Wallet interface
 * This interface defines the structure of a wallet, which is associated with an organization.
 */
export interface Wallet extends Identifiable {
  orgId: string;
  name: string;
  chain: string;
  provider?: string;
  meta?: Map<string, string | number>;
}

/**
 * This interface defines the structure of the organization structure context
 * This structure will be made available to the policy engine at runtime.
 * Serialized into JSON, programmatic policy can be applied to the org structure.
 *
 * policyControls & policyControlConfigs are very useful for debugging and visualization.
 * They most likely will not be used in the programmatic policy engine itself.
 */
export interface OrgStructure {
  orgs: Map<string, Org>;
  actors: Map<string, Actor>;
  policies: Map<string, Policy>;
  policyRules: Map<string, PolicyRule>;
  policyControls: Map<string, PolicyControl>; // very useful for debugging and visualization
  wallets: Map<string, Wallet>;
  wish: Wish;
}

/**
 * The persisted control structure to be executed in order of index (lowest first)
 */
export interface ControlStructure {
  index: number;
  wishId: string;
  policyId: string;
  ruleId: string;
}
