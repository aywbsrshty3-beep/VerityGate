import { Wallet } from "../gel/types";

const wallet: Wallet = {
    id: "123",
    orgId: "ORG1",
    name: "ETH-SET-WAL",
    chain: "EthereumSepolia",
    provider: "DFNS",
    meta: new Map<string, string | number>([
        ["TYPE", "SETTLEMENT"],
        ["COMPLIANT", "YES"],
    ])        
}

console.log(wallet);