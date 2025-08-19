import {get, post} from '../pe/HephaestusUtils'; 

// console.log("list-wallets", get('http://localhost:3000/list-wallets').then(console.log));

// console.log("list-wallets-assets", get("http://localhost:3000/list-wallet-assets?walletId=wa-1ol09-a00l3-9e1p9meafj5q609u").then(console.log));

// console.log("list-wallets-txs", get("http://localhost:3000/list-wallet-txs?walletId=wa-1ol09-a00l3-9e1p9meafj5q609u").then(console.log));

// console.log("list-pending-approvals", get("http://localhost:3000/list-pending-approvals").then(console.log));

// console.log("list-wallet-transfers", get("http://localhost:3000/list-wallet-transfers?walletId=wa-1ol09-a00l3-9e1p9meafj5q609u").then(console.log));

// console.log("get-wallet-transfer", get("http://localhost:3000/get-wallet-transfer?walletId=wa-1ol09-a00l3-9e1p9meafj5q609u&transferId=xfr-61d9a-uo4m8-9nar1dd0prj6j10k").then(console.log));


// let result = post('http://localhost:3000/create-wallet', {
//     "network": "EthereumSepolia",
//     "name": "ETH-WALLET-203"
// })
// console.log("create-wallet", result.then(console.log)); 

// const createTransferPayload = {fromWallet: "wa-1ol09-a00l3-9e1p9meafj5q609u", toAddress: "0xD1eCf18C4703F524B787B9A44d7EcF58365EA74F", amount: "50000000000000000"}
// let result = post('http://localhost:3000/create-transfer', createTransferPayload)
// console.log("create-transfer", result.then(console.log)); 

// let result = post('http://localhost:3000/approve?approvalId=ap-10omh-3csp4-9du9r9tmr0lk529a', {})
// console.log("approve", result.then(console.log)); 


async function allWallets(): Promise<void> {
    console.log("Getting all wallets")
    const wallets = await get('http://localhost:3000/list-wallets');
    console.log(JSON.stringify(wallets));
}

allWallets();

setTimeout(() => {
    console.log("Aurevoir...");
    process.exit(0);
}, 5000);