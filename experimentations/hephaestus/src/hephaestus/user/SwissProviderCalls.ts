import {get, post} from '../pe/HephaestusUtils'; 

//npx ts-node .\src\Hephaestus\user\METACOCalls.ts                

console.log("list-wallets", get('http://localhost:3001/list-wallets').then(console.log));


setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 5000);