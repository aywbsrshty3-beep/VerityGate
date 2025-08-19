/**
 * Identifiable by id
 */
export interface Identifiable {
    id: string;
}

/**
 * An Organisation represents a corporation, which can, optionnally have sub-orgs via the topOrg property
 * It defines meta data, an optional Map of fields where properties such as location, jurisdiction, etc can be added
 */
export interface Organisation {
    topOrg?: Organisation;
    id: string;
    name: string;
    meta?: Map<string, string | number>;
    enabled: boolean;
}

export enum SigAlgo {
    ECC,
    RSA
}

/**
 * An Actor defines a Human Being or Computer (Service).
 * An Actor belongs to one Organisation
 * An Actor as a Role - a free text field, mandatory, defining roles such as MAKER, CHECKER, COMPLIANCE, etc
 */
export interface Actor extends Identifiable {
    id: string;
    name: string;
    role: string;
    orgId: string;
    meta?: Map<string, string | number>;
    publicKey?: string;
    sigAlgo?: SigAlgo;
    enabled: boolean;
}

/**
 * A Policy is at the core of Authorisation of actions on the platform
 * When a Wish is submitted - an intent to perform an action - A Policy must be found for that Wish - otherwise it is rejected.
 * A Policy can apply top to bottom - Policy from the Top must first evaluate to true before the Policy on the Target Org.
 * subOrgApplicability to true allows to apply, for ex, Compliance services at the Top, followed by Transfer Out Policies on the Target Org.
 * A Policy applies to a Wish Kind and defines Rules - in an ordered list - first one is processed - if the rule does not evaluate - we go to the second one etc
 * When a Rule is selected, we need to apply Controls to that Rule - this is done using Controls - there is a mapping between a Rule Id and a Control Id
 */
export interface Policy {
    id: string;
    name: string;
    orgId: string;
    subOrgApplicability: boolean;
    wishKind: string;
    ruleIds: string[];
    controls: Map<string, string>;
    enabled: boolean;
    dynamic?: boolean;
    createdAt?: number;
    validFor?: number;
}

/**
 * A Policy Rule defines an optional JavaScript based expression, when evaluated to true, will be selected
 */
export interface PolicyRule {
    id: string;
    name: string;
    expression?: string;
    enabled: boolean;
}

/**
 * Part of the Policy Control is the Control Config to apply
 * A Control config defines the Roles and The Organisations needed for an approval of the Policy
 * It defines a minimum of approvers - the quorum required to approve
 * If a Role is set to CHECKER and there are two Actors associated with CHECKER, both will be notified for approval
 * If minApprover is set to 1, as long one approves, it is considered successful. If anyone rejects, it is rejected
 */
export interface PolicyControlConfig {
    roles: string[];
    orgs: string[];
    minApprover: number;
    timeoutInSeconds: number;
}

export enum Operand {
    AND, OR
}

/**
 * The Control itself is a Directed Acycliv Graph with Operands, allowing the complex definition of approval schemes
 * If there is no config, operand, left and right must be defined
 * If there is a config, operand, left and right must be null
 */
export interface PolicyControl {
    id: string;
    name: string;
    config?: PolicyControlConfig;
    operand?: string; // TODO Replace with Operand
    left?: PolicyControl;
    right?: PolicyControl;
} 

/**
 * This will defined the JSON structure on which expressions will be evaluated
 */
export interface OrgStructure {
    version?: number;
    orgs: Map<string, Organisation>;
    actors: Map<string, Actor>;
    policies: Map<string, Policy>;
    rules: Map<string, PolicyRule>;
    controls: Map<string, PolicyControl>;
    wish?: Wish;
    wallets?: Map<String, Wallet>;
}

/**
 * A Wish is an intent to perform an action
 * It is done by an Actor (The Maker role) and targets a given Organisation
 * It has a kind (some are pre-defined 'WISH_CREATION', 'TRANSFER_OUT', ....) but they can be generic 
 * In the generic version, this is basically an Policy engine for any custom action
 */
export interface Wish {
    id: string;
    actorId: string;
    tgtOrgId: string;
    kind: string;
    meta?: Map<string, string | number>;
    payload: any;
}

/**
 * A generic payload that is cryptographically signed by an actor
 */
export interface WishPayload {
    wish: Wish;
    signature: string; // base64-encoded signature
}

/**
 * Wallet
 */
export interface Wallet {
    id: string;
    orgId: string;
    name: string;
    chain: string;
    provider?: string;
    meta?: Map<string, string | number>;
}

/**
 * Transfer Out Payload
 */
export interface TransferOutPayload {
    fromWallet: string;
    toAddress: string;
    amount: string;
    meta?: Map<string, string | number>;
}

export interface CreateWalletPayload {
    name: string;
    chain: string;
    meta?: Map<string, string | number>;
    provider?: string; // DFNS or THALES
}

export interface CreatePolicyControlPayload {
}

export interface CreatePolicyRulePayload {
}

export interface CreatePolicyPayload {
}