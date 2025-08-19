import { HephaestusPolicyEngine } from "../pe/hephaestusPolicyEngine"; // Ensure this path is correct and the file exists
import { OrgStructure, Wish, Policy, PolicyRule } from '../pe/hephaestusTypes'; // Adjust the import paths as necessary

describe('hephaestusPolicyEngine Tests 1', () => {
    let hephaestusPolicyEngine: hephaestusPolicyEngine;
    let mockStructure: OrgStructure;

    beforeEach(() => {
        mockStructure = {
            wish: undefined,
            policies: new Map(),
            rules: new Map(),
            controls: new Map(),
            orgs: new Map(),
            actors: new Map()
        };
        hephaestusPolicyEngine = new hephaestusPolicyEngine(mockStructure);
    });

    it('should process a wish and update the structure', () => {
        const wish: Wish = { id: 'wish1', actorId: 'actor1', payload: {}, tgtOrgId: 'org1', kind: 'WISH_KIND' };
        const policy: Policy = { id: 'policy1', orgId: 'org1', enabled: true, wishKind: 'WISH_KIND', ruleIds: ['rule1'], controls: new Map(), name: 'Policy Name', subOrgApplicability: false};
        const rule: PolicyRule = { id: 'rule1', expression: 'true', name: 'Rule Name', enabled: true };

        mockStructure.policies.set('policy1', policy);
        mockStructure.rules.set('rule1', rule);

        hephaestusPolicyEngine.process(wish);

        expect(mockStructure.wish).toEqual(wish);
        expect(hephaestusPolicyEngine['_jsonStructure']).toBeDefined();
    });

    it('should not process a wish if wish creation is not allowed', () => {
        const wish: Wish = { id: 'wish1', actorId: 'actor1', payload: {}, tgtOrgId: 'org1', kind: 'WISH_KIND' };
        const policy: Policy = { id: 'policy1', orgId: 'org1', enabled: true, wishKind: 'WISH_CREATION', ruleIds: ['rule1'], controls: new Map(), name: 'Policy Name', subOrgApplicability: false };
        const rule: PolicyRule = { id: 'rule1', expression: 'false', name: 'Rule Name', enabled: true };

        mockStructure.policies.set('policy1', policy);
        mockStructure.rules.set('rule1', rule);

        hephaestusPolicyEngine.process(wish);

        expect(mockStructure.wish).toBeNull();
    });

    it('should find and apply the correct policy and rule', () => {
        const wish: Wish = { id: 'wish1', actorId: 'actor1', payload: {}, tgtOrgId: 'org1', kind: 'WISH_KIND' };
        const policy: Policy = { id: 'policy1', orgId: 'org1', enabled: true, wishKind: 'WISH_KIND', ruleIds: ['rule1'], controls: new Map([['rule1', 'control1']]), name: 'Policy Name', subOrgApplicability: false};
        const rule: PolicyRule = { id: 'rule1', expression: 'true', name: 'Rule Name', enabled: true };

        mockStructure.policies.set('policy1', policy);
        mockStructure.rules.set('rule1', rule);
        mockStructure.controls.set('control1', { id: 'control1', name: 'Control Name', config: { roles: [], orgs: [], minApprover: 0, timeoutInSeconds: 0 } });

        hephaestusPolicyEngine.process(wish);

        expect(mockStructure.wish).toEqual(wish);
        expect(hephaestusPolicyEngine['_jsonStructure']).toBeDefined();
    });

    it('should log "No Policy or Rule found! Bye." if no policy or rule is found', () => {
        const wish: Wish = { id: 'wish1', actorId: 'actor1', payload: {}, tgtOrgId: 'org1', kind: 'WISH_KIND' };

        console.log = jest.fn();

        hephaestusPolicyEngine.process(wish);

        expect(console.log).toHaveBeenCalledWith("No Policy or Rule found! Bye.");
    });
});