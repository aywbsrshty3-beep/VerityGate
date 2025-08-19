/**
 * This file contains the implementation of a DfnsProvider class.
 * The DfnsProvider class is responsible for handling requests related to service accounts, policies, wallets, and wallet creation.
 * It uses the Express framework to handle HTTP requests and the Axios library to make HTTP requests to external services.
 * The class exposes several endpoints for retrieving lists of service accounts, policies, and wallets, as well as creating a new wallet.
 * The class requires a bearer token for authentication and authorization.
 *
 * @module DfnsServiceProvider
 */
import * as crypto from 'crypto';
import express, {Request, Response } from 'express';
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
import {  toBase64Url} from '../../pe/HephaestusUtils'; 
import { ClientData, CreateUserActionSignaturePayload, UserActionSignature } from './DfnsTypes';

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

const DEFAULT_ENDPOINT = 'https://api.dfns.ninja';

const BEARER_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQ...';
const APPROVER_BEARER_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGci...'

const PRIVATE_KEY = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEA9wy9kUvc...
-----END RSA PRIVATE KEY-----
`

const APPROVER_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9...
-----END PRIVATE KEY-----
`

function nonce() {
    return JSON.stringify({
        'uuid': uuidv4(),
        'date': new Date().toISOString()
    });
}

function headers(approver: boolean) : { [key: string]: string } {
    if (approver) {
        return {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json',
            'X-DFNS-APPID' : 'ap-42qu7-ouhuu-8tr9sq2knl4heb18',
            'X-DFNS-NONCE' : nonce(),
            'Authorization': `Bearer ${APPROVER_BEARER_TOKEN}`
        }
    } else {
        return {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json',
            'X-DFNS-APPID' : 'ap-42qu7-ouhuu-8tr9sq2knl4heb18',
            'X-DFNS-NONCE' : nonce(),
            'Authorization': `Bearer ${BEARER_TOKEN}`
        }
    }
}

app.get('/list-wallet-txs', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId;
        const externalServiceUrl = DEFAULT_ENDPOINT + '/wallets/'+walletId+'/transactions';
        console.log("[DFNS] list-wallet-transactions", walletId, externalServiceUrl); 

        const response = await axios.get(externalServiceUrl, {
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-service-accounts', async (req: Request, res: Response) => {
    try {
        const externalServiceUrl = DEFAULT_ENDPOINT + '/auth/service-accounts';

        const reply = await axios.get(externalServiceUrl, {
            headers: headers(false),
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
            headers: headers(false),
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
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-wallet-assets', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId;
        const externalServiceUrl = DEFAULT_ENDPOINT + '/wallets/'+walletId+'/assets';
        console.log("[DFNS] list-wallet-assets", walletId, externalServiceUrl); 

        const response = await axios.get(externalServiceUrl, {
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/get-wallet-transfer', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId;
        const transferId = req.query.transferId;
        const externalServiceUrl = DEFAULT_ENDPOINT + `/wallets/${walletId}/transfers/${transferId}`;
        console.log("[DFNS] get-wallet-transfer", walletId, externalServiceUrl); 

        const response = await axios.get(externalServiceUrl, {
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function getChallenge<T>(t: T, userActionPath: string, method: string, approver: boolean): Promise<any> {
    // logger.info("[DFNS] getChallenge", t, userActionPath, method); 
    try {
        const actionSigPayload: CreateUserActionSignaturePayload = {
            userActionPayload: JSON.stringify(t),
            userActionHttpMethod: method,
            userActionHttpPath: userActionPath
        };
        const payload = JSON.stringify(actionSigPayload);
        const challenge = await axios.post(DEFAULT_ENDPOINT + "/auth/action/init", payload, {
            headers: headers(approver),
        });

        return challenge.data;
    } catch (error) {
        console.error(error);
        return "ERROR"
    }
}

function signData(data: Uint8Array, approver: boolean = false): string {
    const sha256Signer = crypto.createSign('SHA256');
    
    sha256Signer.update(data);
    sha256Signer.end();
    
    const signature = approver ? sha256Signer.sign(APPROVER_PRIVATE_KEY) : sha256Signer.sign(PRIVATE_KEY);

    return toBase64Url(signature);
}

/**
 * Step 1: Get the challenge and sign i
 * @param challengeData 
 * @returns UserActionSignature
 */
async function getUserActionSignature(challengeData: any, approver: boolean = false): Promise<any> {
    // logger.info("[DFNS] getUserActionSignature");

    const credId = challengeData.allowCredentials.key[0].id;
    // logger.info("[DFNS] credId %s", credId);    

    const challengeIdentifier = challengeData.challengeIdentifier;
    // logger.info("[DFNS] challengeIdentifier %s", challengeIdentifier);   
    
    const challenge = challengeData.challenge;
    // logger.info("[DFNS] challenge %s", challenge);   

    const clientData: ClientData = {
        type: "key.get", 
        challenge: challenge, 
        origin: "https://app.dfns.ninja", 
        crossOrigin: false};
    
    const clientDataJson = JSON.stringify(clientData);
    const clientDataAsBytes = Buffer.from(clientDataJson, 'utf-8');
    
    const signature = signData(clientDataAsBytes, approver);
    // logger.info("[DFNS] signature %s", signature);   

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
async function getUserActionResult(userActionSignature: any, approver: boolean): Promise<any> {
    // logger.info("[DFNS] getUserActionResult");
    const payload = JSON.stringify(userActionSignature);
    // logger.debug("[DFNS] payload", payload);
    const actionResult = await axios.post(DEFAULT_ENDPOINT + "/auth/action", payload, {
        headers: headers(approver),
    });
    return actionResult;
}

async function createWallet<T>(t: T, userActionResult: any): Promise<any> {
    // logger.info("[DFNS] createWallet", t, userActionResult);

    const h = headers(false)
    const userAction = userActionResult.data.userAction;   
    h['X-DFNS-USERACTION'] = userAction;
    // logger.debug("[DFNS] New headers", h);

    const payload = JSON.stringify(t);

    const result = await axios.post(DEFAULT_ENDPOINT + "/wallets", payload, {
        headers: h,
    });
    // logger.debug("[DFNS] result", result);
    return result;
}

/**
 * Creates a Wallet
 * https://app.dfns.ninja/wallets
 */
app.post('/create-wallet', async (req: Request, res: Response) => {
    try {
        // logger.info("[DFNS] /create-wallet", req.headers, req.body);   
        
        const challenge = await getChallenge(req.body, '/wallets', 'POST', false); 
        // logger.info("[DFNS] challenge", challenge);   

        const userActionSignature = await getUserActionSignature(challenge);
        // logger.debug("[DFNS] userActionSignature", userActionSignature);
        // verifySignature(userActionSignature);

        const userActionResult = await getUserActionResult(userActionSignature, false);
        // logger.debug("[DFNS] userActionResult", userActionResult.data);  

        const result = await createWallet(req.body, userActionResult);
        // logger.info("[DFNS] createWallet", result); 
        
        res.status(200).json(result.data);
    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

async function createTransfer<T>(t: T, fromWallet:string, userActionResult: any): Promise<any> {
    console.log("[DFNS] createTransfer", t);

    const h = headers(false)
    const userAction = userActionResult.data.userAction;   
    h['X-DFNS-USERACTION'] = userAction;
    // logger.debug("[DFNS] New headers", h);

    const payload = JSON.stringify(t);

    const url = `/wallets/${fromWallet}/transfers`
    console.log("[DFNS] url", url);   
    let result = await axios.post(DEFAULT_ENDPOINT + url, payload, {
        headers: h,
    });
    // logger.debug("[DFNS] result", result);

    const approvalId = result.data.approvalId;
    console.log("[DFNS] approvalId", approvalId);
    // TODO  - Merge
    {
        const payload = {
            "value": "Approved",
            "reason": "Approved by Hephaestus",
          }

        const url = `/v2/policy-approvals/${approvalId}/decisions`

        console.log("[DFNS] url", url);
        const challenge = await getChallenge(payload, url, 'POST', true); 
        console.log("[DFNS] challenge", challenge);   

        const userActionSignature = await getUserActionSignature(challenge, true);
        console.log("[DFNS] userActionSignature", userActionSignature);   

        const userActionResult = await getUserActionResult(userActionSignature, true);
        console.log("[DFNS] userActionResult.data.userAction", userActionResult.data.userAction);  

        const h = headers(true)
        const userAction = userActionResult.data.userAction;   
        h['X-DFNS-USERACTION'] = userAction;
    
        console.log("[DFNS] Sending approval..."); 
        const r = await axios.post(DEFAULT_ENDPOINT + url, JSON.stringify(payload), {
            headers: h,
        });

        result = r;
        console.log("Done!", r)
    }

    return result;
}

// https://docs.dfns.co/d/api-docs/wallets/transfer-asset-from-wallet
// {"kind": "Native", "to": "0xb282dc7cde21717f18337a596e91ded00b79b25f", "amount": "1000000000"}
app.post('/create-transfer', async (req: Request, res: Response) => {
    try {
        console.log("[DFNS] /create-transfer", req.headers, req.body);   
        const fromWallet = req.body.fromWallet
        const toAddress = req.body.toAddress
        const amount = req.body.amount
        console.log("[DFNS] fromWallet", fromWallet, "toAddress", toAddress, "amount", amount);        

        const payload = {
            "kind": "Native", 
            "to": toAddress, 
            "amount": amount
        }

        const url = `/wallets/${fromWallet}/transfers`
        console.log("[DFNS] url", url);   
        const challenge = await getChallenge(payload, url, 'POST', false); 
        console.log("[DFNS] challenge", challenge);   

        const userActionSignature = await getUserActionSignature(challenge);
        console.log("[DFNS] userActionSignature", userActionSignature);   

        const userActionResult = await getUserActionResult(userActionSignature, false);
        console.log("[DFNS] userActionResult", userActionResult.data);  

        const result = await createTransfer(payload, fromWallet, userActionResult);
        // console.log("[DFNS] createTransfer", result); 
        
        res.status(200).json(result.data);
    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

// POST /v2/policy-approvals/{approvalId}/decisions
app.post('/approve', async (req: Request, res: Response) => {
    try {
        console.log("[DFNS] /approve", req.headers, req.body);   

        const approvalId = req.query.approvalId as string | undefined;
        if (!approvalId) {
            res.status(400).json({ error: 'approvalId is required' });
            return;
        }
       
        console.log("[DFNS] approvalId", approvalId);        

        const payload = {
            "value": "Approved",
            "reason": "Approved by Hephaestus",
          }

        const url = `/v2/policy-approvals/${approvalId}/decisions`

        console.log("[DFNS] url", url);
        const challenge = await getChallenge(payload, url, 'POST', true); 
        console.log("[DFNS] challenge", challenge);   

        const userActionSignature = await getUserActionSignature(challenge, true);
        console.log("[DFNS] userActionSignature", userActionSignature);   

        const userActionResult = await getUserActionResult(userActionSignature, true);
        console.log("[DFNS] userActionResult.data.userAction", userActionResult.data.userAction);  

        const h = headers(true)
        const userAction = userActionResult.data.userAction;   
        h['X-DFNS-USERACTION'] = userAction;
    
        console.log("[DFNS] Sending approval"); 
        const result = await axios.post(DEFAULT_ENDPOINT + url, JSON.stringify(payload), {
            headers: h,
        });
        
        res.status(200).json(result.data);
    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

app.get('/list-pending-approvals', async (req: Request, res: Response) => {
    try {
        const externalServiceUrl = DEFAULT_ENDPOINT + '/v2/policy-approvals';
        console.log("[DFNS] list-pending-approvals", externalServiceUrl); 

        const response = await axios.get(externalServiceUrl, {
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-wallet-transfers', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId as string | undefined;
        if (!walletId) {
            res.status(400).json({ error: 'walletId is required' });
            return;
        }
       
        console.log("[DFNS] walletId", walletId);   

        const externalServiceUrl = DEFAULT_ENDPOINT + `/wallets/${walletId}/transfers`;
        console.log("[DFNS] list-wallet-transfers", externalServiceUrl); 

        const response = await axios.get(externalServiceUrl, {
            headers: headers(false),
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`[DFNS Service] is running on port ${PORT}`);
});