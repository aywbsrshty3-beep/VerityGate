const mymap = new Map([
    ['k1', 123],
    ['k2', 321]
]);

const myarray = [...mymap.values()]
console.log(myarray)

// Convert Map to an object
const jsonObject = Object.fromEntries(mymap);
console.log("jsonObject:", jsonObject); 

// Serialize the object to JSON
const jsonString = JSON.stringify(jsonObject);
console.log("jsonString:", jsonString); 

const _context = '{"name": "Bob", "age": 30}';
//const expression = `const person = ${jsonString}; person.name`;
const expression = `const ctx = ${_context}; ctx.name === "Bob"` 

const result = eval(expression); 
console.log(result); // Output: 

const ctx = '{"org":{"id":"SC1","name":"SuperCorp","enabled":true},"actors":{"TJ":{"id":"TJ","name":"Thierry","role":"MAKER","orgId":"SC1","enabled":true},"CJ":{"id":"CJ","name":"Claire","role":"CHECKER","orgId":"SC1","enabled":true},"CO":{"id":"CO","name":"CO","role":"COMPLIANCE_OPS","orgId":"SC1","enabled":true},"WLS":{"id":"WLS","name":"WHITELIST SERVICE","role":"COMPLIANCE","orgId":"SC1","enabled":true},"KYT":{"id":"KYT","name":"KYT SERVICE","role":"COMPLIANCE","orgId":"SC1","enabled":true}},"policies":{"WP-1":{"id":"WP-1","name":"With Creation Policy","orgId":"SC1","subOrgApplicability":false,"wishKind":"WISH_CREATION","ruleIds":["WPR-1"],"enabled":true,"validFor":1.7976931348623157e+308}},"rules":[{"id":"WPR-1","name":"Wish Creation Rule","priority":0,"expression":"ctx.wish.actor.orgId === wish.targetOrgId"}],"controls":[],"wish":{"id":"TFTO-1","actorId":"TJ","tgtOrgId":"SC1","kind":"TRANSFER_OUT","payload":{}}}'
const expr = 
    `
    const ctx = ${ctx}; 
    ctx.org.id === "SC1" && 
    ctx.org.enabled == true &&
    ctx.actors['TJ'].role === 'MAKER'
    ` 

// {"k1":"v1","k2":"v2"}
console.log("EVAL 1 /", eval(expr));

// TEST WISH CREATOR
// ctx.actors[ctx.wish.actorId].orgId === wish.tgtOrgId
const expr2 = 
    `
    const ctx = ${ctx}; 
    ctx.actors[ctx.wish.actorId].orgId === ctx.wish.tgtOrgId &&
    ctx.actors[ctx.wish.actorId].role === 'MAKER'
    ` 

console.log("EVAL 2 /", eval(expr2));

const now = new Date();
console.log("now", now.getTime())
const diff = new Date().getTime() - now.getTime();
console.log("diff", diff)
