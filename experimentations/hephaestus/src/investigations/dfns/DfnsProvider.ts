/**
 * This file contains the implementation of a DfnsProvider class.
 * The DfnsProvider class is responsible for handling requests related to service accounts, policies, wallets, and wallet creation.
 * It uses the Express framework to handle HTTP requests and the Axios library to make HTTP requests to external services.
 * The class exposes several endpoints for retrieving lists of service accounts, policies, and wallets, as well as creating a new wallet.
 * The class requires a bearer token for authentication and authorization.
 *
 * @module DfnsProvider
 */

import * as crypto from 'crypto';
import express, { Request, Response } from 'express';
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

const DEFAULT_ENDPOINT = 'https://api.dfns.ninja';
const BEARER_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9.eyJpc3MiOiJhdXRoLmRmbnMubmluamEiLCJhdWQiOiJkZm5zOmF1dGg6dXNlciIsInN1YiI6Im9yLTFpYWE1LTlybjNmLTlpdXF2ODRzanBmaGNqaGUiLCJqdGkiOiJ0by02ZWVwMy0wZ3Nxdi05YWFidGYzYzdvaGlpbzZwIiwic2NvcGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImh0dHBzOi8vY3VzdG9tL3VzZXJuYW1lIjoiMzdjIiwiaHR0cHM6Ly9jdXN0b20vYXBwX21ldGFkYXRhIjp7InVzZXJJZCI6InVzLTZrNDRxLWFvaWd2LTk5MDg0ZWszaDBkcmM1aWEiLCJvcmdJZCI6Im9yLTFpYWE1LTlybjNmLTlpdXF2ODRzanBmaGNqaGUiLCJ0b2tlbktpbmQiOiJTZXJ2aWNlQWNjb3VudCJ9LCJpYXQiOjE3MjYwNDg2ODYsImV4cCI6MTc4OTEyMDY4Nn0.Im0JwBf8pjtfBwmQU6KhJrwMNbVBddpWlQL1azLMujs9fGC9hUOmEG0Zx_X6AWaoCNAxhJqDdNYGWC6YI4KlBA';
const PRIVATE_KEY = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEA9wy9kUvcR/tdR0bAnttmpM/KpBhn36gvEQ47ZcfB/U1EcUMA
43P7WLpZXQ5D38XW1GH7miI22nNvfUbKbdCWpw2rwIOZTNy5zB59rdmtGA162rBB
2aexmqKmAR/oeMydFOsI19Z/S3bSpj7omtfyMUBaYWY2XWO7oub6aqiHk8C1LsZ2
/DxHbstevkuOY5Ax1KQwefvPwwGPnTkkEZuNv46nxtjZTJX1WRf82huhC3QuthxA
krp11J0h1tnMjuLjQN4J+ngON1WCj80r3lrQU0L42uALd2Oi9Q2RH6YFuHGiIBSC
7l6SNCUtJp/cR8NNYOA9y4ncBFeFhIchwumjawIDAQABAoIBAQCUiciAz8fGT9Ap
xtSRrwDsHzOLrlDmHM0PyCrWa2Cr2AVKxCqIl3eMRZ7tYGJW7TDZyX/pkKDCf52N
CT80/7FVB9c4jOdjW2Mq4zpViQeV6qTvUAKHx1f1zc1Z58FywDPCG/7ZJ1KqIOtO
oYxhbW1lR3gQD9CoHgr3S0FNV78Miib1j+AhFiXuHLH59rVndloc++Gu5Y1jwhDw
NBEwjG9xn+gfzsKsFz9HjyIM+SaAh8kDyS1KudlDNduo/OY7opNQGXF7etw4g/Pk
E+s94ngZZtHuR2a5/D35Fe9TeWJ9cHFKssl071kAYj+b89B3EHuk1G0/5PhOKLVz
uBcPC9ihAoGBAP6tmxC0yhLusI7EphnnkIjzdOrntAjX70WO3c6tPFmcwa/zvaJC
z4EaVdTFOjCs3pZpuBIIQl8ewD7y9JEu2H1Xfli3gFeUDCXjqxe+0xxsOKRyn/iH
Zq39mz6BpQJNyU2eSOFaxfDLTld4OPC7UCXJmGf92D0T5iSex6/MhTGlAoGBAPhU
/7Q8Bd7sPxcIbbdwdkFMhl0SYFVEheA4rvOL1f3B32GyyRRM/dznRRHV+ITcyhQ7
9AOVrNfDMzJ4de8MGL/3RaSZjgaAJpamUC8wq6f5p3qMn6ykjc9UF3FZ1btcmvsd
2R4VRGS0hNGw3+NKv3zLYm68cywbf0IZjmpNRlPPAoGBAIwKYFsWXot8jr9iqMdT
yulTnfXRhPDb9Ck2fwc3wRixltuu1pbT0BB4r7u429+KHzdsWJgpzH1LhoDWzd7L
eKWrp8EW3k7KDMgE4b7D4ogdhiP/F7HsmmyQKH59gYO7zDaPFBo+9NsMoD5+0Cin
h1HQAaslLXOgbouyd7FWb+M1AoGBALhtZ/pTGYkVq0VP3Sv/OdQFIUS+AQ1Sdpqv
fj8h+ysacOv9+5g4FdGZcJJudsM1tl6QqAiBgHw9XCh/jhaaxUbMPcygvfnV8tKv
cZ2aZ+G4Z8l75poxG6B+s2pbbYBYpkEZScYtxT2FU57n3V7QhKYJ5nCXRHHdegV9
NWd9PF3BAoGBAL4iZjxDIeUsLvojWYNqkNgtu0W7LSGig21tY07nkvUVjgiSJD7R
p5ZEDnRPveMWz1B2VYL9mlbZgMkswkXRpwmLlNcxuJHp0xKPr94eX88V7EkAnZqK
ugnH1737Z4ba6LcCGoJxi3UAZDu/l5QG86M4hdvhbUkNNedDsZlnQjOj
-----END RSA PRIVATE KEY-----

`
function nonce() {
    return JSON.stringify({
        'uuid': uuidv4(),
        'date': new Date().toISOString()
    });
}

function headers() : { [key: string]: string } {
    return {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json',
        'X-DFNS-APPID' : 'ap-42qu7-ouhuu-8tr9sq2knl4heb18',
        'X-DFNS-NONCE' : nonce(),
        'Authorization': `Bearer ${BEARER_TOKEN}`
    }
}

app.get('/list-service-accounts', async (req: Request, res: Response) => {
    try {
        const externalServiceUrl = DEFAULT_ENDPOINT + '/auth/service-accounts';

        const reply = await axios.get(externalServiceUrl, {
            headers: headers(),
        });

        res.json(reply.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-policies', async (req: Request, res: Response) => {
    try {
        const externalServiceUrl = DEFAULT_ENDPOINT + '/v2/policies';

        const response = await axios.get(externalServiceUrl, {
            headers: headers(),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-wallets', async (req: Request, res: Response) => {
    try {
        const externalServiceUrl = DEFAULT_ENDPOINT + '/wallets';

        const response = await axios.get(externalServiceUrl, {
            headers: headers(),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

interface CreateUserActionSignaturePayload {
    userActionPayload: string;
    userActionHttpMethod: string;
    userActionHttpPath: string;
}

async function getChallenge<T>(t: T, userActionPath: string, method: string): Promise<any> {
    console.log(">>> getChallenge", t, userActionPath, method); 
    try {
        const actionSigPayload: CreateUserActionSignaturePayload = {
            userActionPayload: JSON.stringify(t),
            userActionHttpMethod: method,
            userActionHttpPath: userActionPath
        };
        const payload = JSON.stringify(actionSigPayload);
        const challenge = await axios.post(DEFAULT_ENDPOINT + "/auth/action/init", payload, {
            headers: headers(),
        });

        return challenge.data;
    } catch (error) {
        console.error(error);
        return "ERROR"
    }
}

interface ClientData {
    type: string;
    challenge: string;
    origin: string;
    crossOrigin: boolean
}

function toBase64Url(buffer: Buffer | Uint8Array): string {
    let base64 = Buffer.from(buffer).toString('base64');
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64;
}

function fromBase64Url(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64');
}

function signData(data: Uint8Array): string {
    const sha256Signer = crypto.createSign('SHA256');
    
    sha256Signer.update(data);
    sha256Signer.end();
    
    const signature = sha256Signer.sign(PRIVATE_KEY);

    return toBase64Url(signature);
}

interface CredentialAssertion {
    credId: string;
    clientData: string;
    signature: string;
}

interface FirstFactor {
    kind: string;
    credentialAssertion: CredentialAssertion
}

interface UserActionSignature {
    challengeIdentifier: string;
    firstFactor: FirstFactor;
}

/**
 * Step 1: Get the challenge and sign i
 * @param challengeData 
 * @returns UserActionSignature
 */
async function getUserActionSignature(challengeData: any): Promise<any> {
    console.log(">>> getUserActionSignature");

    const credId = challengeData.allowCredentials.key[0].id;
    console.log("credId", credId);    

    const challengeIdentifier = challengeData.challengeIdentifier;
    console.log("challengeIdentifier", challengeIdentifier);   
    
    const challenge = challengeData.challenge;
    console.log("challenge", challenge);   

    const clientData: ClientData = {
        type: "key.get", 
        challenge: challenge, 
        origin: "https://app.dfns.ninja", 
        crossOrigin: false};
    
    const clientDataJson = JSON.stringify(clientData);
    const clientDataAsBytes = Buffer.from(clientDataJson, 'utf-8');
    
    const signature = signData(clientDataAsBytes);
    console.log("signature", signature);   

    const userActionSignature: UserActionSignature = {
        challengeIdentifier: challengeIdentifier,
        firstFactor: {
            kind: "Key",
            credentialAssertion: {
                credId: credId,
                clientData: toBase64Url(clientDataAsBytes),
                signature: signature
            }
        }     
    }

    return userActionSignature;
}

/**
 * Step 2: Send the signed challenge
 * @param userActionSignature
 */
async function getUserActionResult(userActionSignature: any): Promise<any> {
    console.log(">>> getUserActionResult");
    const payload = JSON.stringify(userActionSignature);
    console.log("payload", payload);
    const actionResult = await axios.post(DEFAULT_ENDPOINT + "/auth/action", payload, {
        headers: headers(),
    });
    return actionResult;
}

async function createWallet<T>(t: T, userActionResult: any): Promise<any> {
    console.log(">>> createWallet", t, userActionResult);

    const h = headers()
    const userAction = userActionResult.data.userAction;   
    h['X-DFNS-USERACTION'] = userAction;
    console.log("New headers", h);

    const payload = JSON.stringify(t);

    const result = await axios.post(DEFAULT_ENDPOINT + "/wallets", payload, {
        headers: h,
    });

    return result;
}

/**
 * Creates a Wallet
 * https://app.dfns.ninja/wallets
 */
app.post('/create-wallet', async (req: Request, res: Response) => {
    try {
        console.log(">>> /create-wallet", req.headers, req.body);   
        
        const challenge = await getChallenge(req.body, '/wallets', 'POST'); 
        console.log("challenge", challenge);   

        const userActionSignature = await getUserActionSignature(challenge);
        console.log("userActionSignature", userActionSignature);
        // verifySignature(userActionSignature);

        const userActionResult = await getUserActionResult(userActionSignature);
        console.log("userActionResult", userActionResult.data);  

        const result = await createWallet(req.body, userActionResult);
        
        console.log("Status Result", result.status);
        console.log("Data Result", result.data);

        res.status(200).json(result.data);
    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

app.listen(PORT, () => {
    console.log(`DFNS Service is running on port ${PORT}`);
});