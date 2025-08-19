import {Organisation, OrgStructure, Wish, Policy, PolicyRule, PolicyControl} from './HephaestusTypes';
import {map2json} from './HephaestusUtils';  
import {HephaestusDatabase} from './HephaestusDatabase';

/**
 * Hephaestus Policy Engine II: Full Implementation of the PE, incuding top down and dynamic policies.
 */

export class HephaestusPolicyEngineII {
    private _structure: OrgStructure;
    private _jsonStructure: string | undefined;
    private db = HephaestusDatabase.getInstance();

    constructor(_structure: OrgStructure) {
        this._structure = _structure;
    }   

    /**
     * Processes a wish.
     * 
     * @param wish - The wish to be processed.
     * @returns true
     */
    process(wish: Wish): boolean {
        console.log("[Hephaestus PE] process", wish)
        this._structure.wish = wish;
        this._jsonStructure = JSON.stringify(this._structure, map2json);
        console.log("[Hephaestus PE] _structure", JSON.stringify(this._structure, map2json));

        // Is Wish Creation Allowed?
        console.log("[Hephaestus PE] Is wish creation allowed? ...");
        if (!this.isWishCreationAllowed(wish)) {
            console.error("[Hephaestus PE] ... No");
            return false;
        }
        console.log("[Hephaestus PE] ... Yes, processing wish", wish);

        // Select all enabled policies for the targeted org of that wish kind
        const selectedPolicies: Policy[] = [...this._structure.policies.values()].map(p => p).filter(p =>  
            p.orgId === wish.tgtOrgId && p.enabled && p.wishKind === wish.kind)

        // Iterate over those policies to find the right one
        // TODO: Get Policies Top-Down - Multiple policies can apply.....
        // TODO: Select Dynamic Policies (Escrow type scenario)
        let selectedPolicy: Policy|undefined = undefined;
        let selectedRule: PolicyRule|undefined = undefined;

        for(const policy of selectedPolicies) {
            console.log("[Hephaestus PE] [FOR LOOP/1] Checking policy", policy.id);   
            for(const ruleId of policy.ruleIds) {
                console.log("[Hephaestus PE] [FOR LOOP/2] Checking rule", ruleId);
                const rule: PolicyRule|undefined = this._structure.rules.get(ruleId);
                
                if (rule != undefined) {
                    if (rule.expression) {
                        const outcome = this.evaluate(rule.expression);
                        console.log("[Hephaestus PE] [WISH KIND] Rule's evaluation outcome = ", outcome);
    
                        if (outcome) {
                            selectedPolicy = policy;
                            selectedRule = rule;
                            break;
                        }
                    } else {
                        selectedPolicy = policy;
                        selectedRule = rule;
                        break;
                    }
                }
            }
            if (selectedPolicy != undefined && selectedRule != undefined) {
                break;
            }
        }

        if (selectedPolicy != undefined && selectedRule != undefined) {
            console.log("[Hephaestus PE] Found policy and rule id", selectedPolicy.id, selectedRule.id);
        } else {
            console.error("[Hephaestus PE] No Policy or Rule found! Bye.")
            return false;
        }

        const selectedControls: Map<string, string> = new Map<string, string>(Object.entries(selectedPolicy.controls));
        // logger.info("[Hephaestus PE] selectedControls:", selectedControls);
        const controlId = selectedControls.get(selectedRule.id)
        // Controls is a DAG that needs to be converted into a Polish-based notation...
        // Get Controls from the Rule and execute them. See WalkerTest2
        // Once the controls have been successfully executed, execute the transfer out
        console.log("[Hephaestus PE] Control Id", controlId);
        if (controlId) {
            console.log("[Hephaestus PE] Control", this._structure.controls.get(controlId));
            const control = this._structure.controls.get(controlId);
            if (control) {
                // The following code converts the DAG expressed in JSON into an expression that can be evaluated
                const controExpr = this.controlToExpression(control);
                console.log("Control Expression: ", controExpr);
                this.db.insertData("Hephaestus.appliedcontrols", {wishId : wish.id, policyControlId: control.id, expression: controExpr})    
                // logger.info("[Hephaestus PE] Control Expression: %s", controExpr);
            } else {
                console.warn("No control found!")
            }
        }       
        
        return true;
    }

    /**
     * Use Case 1: (CHECKER_CTRL-1 AND ((KYT_CTRL-1 OR CO_CTRL-1) AND (WLS_CTRL-1 OR CO_CTRL-1)))
     * Use Case 2: EXC-POL-CTRL-1
     * Use Case 3: policy-control-3697b86e-a173-487a-80a6-b00f72002f82
     * Use Case 4: CUST-POL-CTRL
     * @returns The expression
     */
    controlToExpression(node: PolicyControl): string {
        if (node.operand) {
            return `(${this.controlToExpression(node.left!)} ${node.operand} ${this.controlToExpression(node.right!)})`;
        } else {
            return node.id
        }
    }

    /**
     * isWishCreationAllowed
     * @param wish 
     * @returns true if the wish creation is allowed, false otherwise
     */
    isWishCreationAllowed(wish: Wish): boolean {
        const selectedPolicies: Policy[] = [...this._structure.policies.values()].map(p => p).filter(p =>  
            p.orgId === wish.tgtOrgId && p.enabled && p.wishKind === "WISH_CREATION")

        if (selectedPolicies.length === 0) {
            console.error("[Hephaestus PE] (isWishCreationAllowed) No policies found for wish creation!");
            return false;
        }

        let wishAllowed = false;
        console.log("[Hephaestus PE] (isWishCreationAllowed) Nb of policies: ", selectedPolicies.length);
        for(const wishPolicy of selectedPolicies) {
            console.log("[Hephaestus PE] (isWishCreationAllowed) Selected Wish Policy: ", wishPolicy);
            const ruleId: string = wishPolicy.ruleIds[0]
            const selectedRule: PolicyRule = [...this._structure.rules.values()].map(r => r).filter(r => r.id === ruleId)[0]
            console.log("[Hephaestus PE] (isWishCreationAllowed) Selected Rule: ", selectedRule);

            if (selectedRule.expression) {
                const outcome = this.evaluate(selectedRule.expression)
                if (outcome) {
                    console.log("[Hephaestus PE] (isWishCreationAllowed) Rule's evaluation is true, using it!", selectedRule.id);
                    wishAllowed = true;
                    break;
                } else {
                    console.warn("[Hephaestus PE] (isWishCreationAllowed) Rule's evaluation failed! Going for next one", outcome);
                }
            } else {
                console.log("[Hephaestus PE] (isWishCreationAllowed) No expression in rule, using it!", selectedRule.id);
                wishAllowed = true;
            }
        }

        return wishAllowed;
    }

    /**
     * Evaluates a JSON expression.
     * @param expression TODO: check no dangerous keyword inserted: function, call, return, eval, lambda at the rule expression level (on creation)
     * @returns true or false
     */
    evaluate(expression: string): boolean {
        console.log("[Hephaestus PE] evaluate...");

        try {
            const expr = 
        `
            const ctx = ${this._jsonStructure}; 
            ${expression}
        `;

        const res =  eval(expr)
        console.log(" ", res);
        return res;
        } catch (error) {
            console.error("[Hephaestus PE] Error evaluating expression", error);
            return false
        }
    }
}