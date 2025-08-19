import { Stack } from './Stack';
import {OrgStructure, Wish, Policy, PolicyRule, PolicyControl} from './types';

/**
 * Basic Policy Engine 
 */
export class PolicyEngine {
    private _structure: OrgStructure;
    private _jsonStructure: string | undefined;

    constructor(_structure: OrgStructure) {
        this._structure = _structure;
    }   

    /**
     * Processes a wish.
     * 
     * @param wish - The wish to be processed.
     * @returns void
     */
    process(wish: Wish): void {
        console.log("process", wish)
        this._structure.wish = wish;
        this._jsonStructure = JSON.stringify(this._structure, this.map2json);
        console.log("JSON Structure", this._jsonStructure);

        // return;

        // Is Wish Creation Allowed?
        console.log("IS WISH CREATION ALLOWED? ...")
        if (!this.isWishCreationAllowed(wish)) {
            console.log(" ... NO");
            return;
        }
        console.log(" ... YES");

        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        console.log("PROCESSING WISH ...", wish)

        // Select all enabled policies for the targeted org of that wish kind
        const selectedPolicies: Policy[] = [...this._structure.policies.values()].map(p => p).filter(p =>  
            p.orgId === wish.tgtOrgId && p.enabled && p.wishKind === wish.kind)

        // Iterate over those policies to find the right one
        // TODO: Get Policies Top-Down
        // TODO: Select Dynamic Policies (Escrow type scenario)
        let selectedPolicy: Policy|undefined = undefined;
        let selectedRule: PolicyRule|undefined = undefined;

        for(const policy of selectedPolicies) {
            console.log("[FOR LOOP/1] Checking policy", policy.id);   
            for(const ruleId of policy.ruleIds) {
                console.log("[FOR LOOP/2] Checking rule", ruleId);
                const rule: PolicyRule|undefined = this._structure.rules.get(ruleId);
                
                if (rule != undefined) {
                    if (rule.expression) {
                        const outcome = this.evaluate(rule.expression);
                        console.log("[WISH KIND] Rule's evaluation:", outcome);
    
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
            console.log("Found policy:", selectedPolicy.id, " rule:", selectedRule.id);
        } else {
            console.log("No Policy or Rule found! Bye.")
            return;
        }

        const selectedControls: Map<string, string> = selectedPolicy.controls;
        const controlId = selectedControls.get(selectedRule.id)
        // Controls is a DAG that needs to be converted into a Polish-based notation...
        // Get Controls from the Rule and execute them. See WalkerTest2
        // Once the controls have been successfully executed, execute the transfer out
        console.log("Control Id:", controlId);
        if (controlId) {
            console.log("Control", this._structure.controls.get(controlId));
            const control = this._structure.controls.get(controlId);
            if (control) {
                // The following code converts the DAG expressed in JSON into an expression that can be evaluated
                const controExpr = this.controlToExpression(control);
                console.log("Control Expression:", controExpr);
            }
        }        

        console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
    }

    /**
     * 
     * @param node Use Case 1: (CHECKER_CTRL-1 AND ((KYT_CTRL-1 OR CO_CTRL-1) AND (WLS_CTRL-1 OR CO_CTRL-1)))
     *             Use Case 2: EXC-POL-CTRL-1
     *             Use Case 3: policy-control-3697b86e-a173-487a-80a6-b00f72002f82
     *             Use Case 4: CUST-POL-CTRL
     * @returns The expression
     */
    controlToExpression(node: PolicyControl): string {
        if (node.operand) {
            return `(${this.controlToExpression(node.left!)} ${node.operand} ${this.controlToExpression(node.right!)})`;
        } else {
            return node.id
        }
    }

    isWishCreationAllowed(wish: Wish): boolean {
        const selectedPolicies: Policy[] = [...this._structure.policies.values()].map(p => p).filter(p =>  
            p.orgId === wish.tgtOrgId && p.enabled && p.wishKind === "WISH_CREATION")
        // console.log("Selected Policies For Wish Creation: ", selectedPolicies);
        const selectedPolicy: Policy = selectedPolicies[0]
        console.log("Selected Policy For Wish Creation: ", selectedPolicy);
        const ruleId: string = selectedPolicy.ruleIds[0]
        const selectedRule: PolicyRule = [...this._structure.rules.values()].map(r => r).filter(r => r.id === ruleId)[0]
        console.log("Selected Rule For Wish Creation: ", selectedRule);

        if (selectedRule.expression) {
            const outcome = this.evaluate(selectedRule.expression)
            if (outcome) {
                console.log("[WISH CREATION] Rule's evaluation is true, using it!", selectedRule.id);
                return true;
            } else {
                console.log("[WISH CREATION] Rule's evaluation failed!", outcome);
                return false;
            }
        } else {
            console.log("[WISH CREATION] No expression in rule, using it!", selectedRule.id);
            return true;
        }
    }

    map2json(key:string, value:any) {
        if(value instanceof Map) {
            const jsonObject = Object.fromEntries(value);
            return jsonObject;
        } else {
            return value;
        }
    }

    /**
     * Evaluate a JSON expression.
     * @param expression TODO: check no dangerous keyword inserted: function, call, return, eval, lambda
     * @returns true or false
     */
    evaluate(expression: string): boolean {
        console.log("Evaluating expression on structure: ", expression);

        try {
            const expr = 
        `
            const ctx = ${this._jsonStructure}; 
            ${expression}
        `;

        return eval(expr)
        } catch (error) {
            console.error("Error evaluating expression", error);
            return false
        }
    }
}