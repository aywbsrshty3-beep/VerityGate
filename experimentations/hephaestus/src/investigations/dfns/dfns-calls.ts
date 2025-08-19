import axios from 'axios';

function headers() {
    return {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json',
        'User-Agent': 'TJ/1.0',
    }
}

async function post(url: string, data: any): Promise<any> {
    try {
        console.log("-> post", url, data); 
        const response = await axios.post(url, data, {
            headers: headers(),
        });
        return response.data;
    } catch (error) {
        // Handle error here
        console.error('Error invoking REST service:', error);
        throw error;
    }
}

async function get(url: string): Promise<any> {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        // Handle error here
        console.error('Error invoking REST service:', error);
        throw error;
    }
}

console.log("list-wallets", get('http://localhost:3000/list-wallets').then(console.log));

// let result = post('http://localhost:3000/create-wallet', {
//     "network": "EthereumSepolia",
//     "name": "ETH-WALLET-203"
// })
// console.log("create-wallet", result.then(console.log)); 
