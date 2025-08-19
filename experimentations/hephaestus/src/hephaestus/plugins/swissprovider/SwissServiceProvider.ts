/**
 * This file contains the implementation of a DfnsProvider class.
 * The DfnsProvider class is responsible for handling requests related to service accounts, policies, wallets, and wallet creation.
 * It uses the Express framework to handle HTTP requests and the Axios library to make HTTP requests to external services.
 * The class exposes several endpoints for retrieving lists of service accounts, policies, and wallets, as well as creating a new wallet.
 * The class requires a bearer token for authentication and authorization.
 *
 * @module MetacoServiceProvider
 */

import * as crypto from 'crypto';
import { Request, Response, Application } from 'express';

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const stringify = require('fast-json-stable-stringify');


const app: Application = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setTimeout(60000, () => {
        console.log('Request has timed out.');
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
});


const PORT = 3001;

const DEFAULT_ENDPOINT = 'https://....io';

const COMPANY_ID = '37'
const COMPANY_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhk.....
-----END PRIVATE KEY-----
`

const MAKER_ID = '37-maker@....com'
const MAKER_PRIVATE_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIK...
-----END EC PRIVATE KEY-----`

const CHECKER_ID = '37-checker@....com'
const CHECKER_PRIVATE_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG/...
-----END EC PRIVATE KEY-----`


function headers(submetterId: string, url: string, payload: any): { [key: string]: string } {
    const requestId = uuidv4()
    const requestAt = new Date().getTime().toString()
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'company-identifier': COMPANY_ID,
        'request-identifier': requestId,
        'request-timestamp': requestAt,
        'submitter-id': submetterId,
        'signature': signRequest(COMPANY_ID, requestId, requestAt, url, JSON.stringify(payload))
    }
}


function signRequest(company_id: string, requestId: string, requestAt: string, url: string, body: string) {
    const sha256Signer = crypto.createSign('SHA256');

    const dataToSign = [company_id, requestId, requestAt, url, body].join(':')
    //console.log(`data to sign : ${dataToSign}`)

    const bytes = Buffer.from(dataToSign, 'utf-8');

    sha256Signer.update(bytes);
    sha256Signer.end();

    const signature = sha256Signer.sign(COMPANY_PRIVATE_KEY);
    return signature.toString('base64');
}

async function apiCall(url: string, submitterId: string, body: any) {

    try {
        const response = await axios.post(url, body, {
            headers: headers(submitterId, url, body),
        });

        console.log(response.data);
        return response.data;
    } catch (error) {
        throw new Error('internal error');
    }
}

app.get('/list-wallet-txs', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId;
        const url = `${DEFAULT_ENDPOINT}/v3/api/custody/transactions`


        let payload = {
            walletIds: [walletId]
        }
        console.log("[Swiss Provider] list-wallet-transactions : ", walletId, payload);

        const response = await apiCall(url, MAKER_ID, payload);

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/list-wallets', async (req: Request, res: Response) => {
    try {
        const url = `${DEFAULT_ENDPOINT}/v3/api/custody/wallets`

        const payload = {
        }

        console.log("[Swiss Provider] list-wallets : ", payload);

        const response = await apiCall(url, MAKER_ID, payload);

        res.json(response);
    } catch (error) {
        console.error('error')
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/wallet-address', async (req: Request, res: Response) => {
    try {

        const walletId = req.query.walletId;

        const url = `${DEFAULT_ENDPOINT}/v3/api/custody/wallets/addresses/generate`
        const payload = {
            walletId: walletId
        }

        console.log("[Swiss Provider] wallet-address : ", payload);

        const response = await apiCall(url, MAKER_ID, payload);

        res.json(response);
    } catch (error) {
        console.error('error')
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-wallet-assets', async (req: Request, res: Response) => {
    try {
        const walletId = req.query.walletId;
        const url = `${DEFAULT_ENDPOINT}/v3/api/custody/wallets`
        console.log("[Swiss Provider] list-wallet-assets", walletId, url);
        const payload = {
            'ids': [walletId]
        }
        const response = await apiCall(url, MAKER_ID, payload);
        const assets = response.items[0].balances.map((balance: any) => balance.currency);
        console.log(assets);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

interface ServiceDeskRequest<T> {
    serviceId: string;
    payload: T;
}

interface CreateWalletRequest {
    name: string;
    currency: string;
}


interface ServiceDeskPendingRequest {
    requestId: string;
}

interface ServiceDeskApproveRejectRequest {
    requestId: string;
    request: any;
    signature: string;
}

async function createWallet(payload: CreateWalletRequest): Promise<any> {
    console.log("[Swiss Provider] createWallet", payload);

    const request: ServiceDeskRequest<CreateWalletRequest> = {
        serviceId: '0x0013-001',
        payload: payload
    };

    const url = `${DEFAULT_ENDPOINT}/v3/api/servicedesk/create`

    const response = await apiCall(url, MAKER_ID, request);

    return response;
}

async function makerApproveRequest(requestId: string) {

    const pendingRequest: ServiceDeskPendingRequest = {
        requestId: requestId
    }

    const pendingRequestResponse = await apiCall(`${DEFAULT_ENDPOINT}/v3/api/servicedesk/pending`, MAKER_ID, pendingRequest);

    const signedRequest: ServiceDeskApproveRejectRequest = {
        requestId: requestId,
        request: pendingRequestResponse.request,
        signature: signUserRequest(MAKER_PRIVATE_KEY, pendingRequestResponse.request)
    };

    await apiCall(`${DEFAULT_ENDPOINT}/v3/api/servicedesk/approve`, MAKER_ID, signedRequest);
}

async function checkerApproveRequest(requestId: string) {

    const pendingRequest: ServiceDeskPendingRequest = {
        requestId: requestId
    }

    const pendingRequestResponse = await apiCall(`${DEFAULT_ENDPOINT}/v3/api/servicedesk/pending`, CHECKER_ID, pendingRequest);

    pendingRequestResponse.request.type = 'Approve'
    delete pendingRequestResponse.request.rejectReason;

    const signedRequest: ServiceDeskApproveRejectRequest = {
        requestId: requestId,
        request: pendingRequestResponse.request,
        signature: signUserRequest(CHECKER_PRIVATE_KEY, pendingRequestResponse.request)
    }
    console.log('signed request : ', stringify(signedRequest));

    await apiCall(`${DEFAULT_ENDPOINT}/v3/api/servicedesk/approve`, CHECKER_ID, signedRequest);
}

async function submitServiceRequest(requestId: string) {

    const request: ServiceDeskPendingRequest = {
        requestId: requestId
    }

    await apiCall(`${DEFAULT_ENDPOINT}/v3/api/servicedesk/submit`, MAKER_ID, request);
}

function signUserRequest(privateKey: string, request: any): string {
    const requestStringified = stringify(request);
    try {
        const buffer = Buffer.from(requestStringified, 'utf8');
        const signature: string = crypto
            .createSign('sha256')
            .update(buffer)
            .sign(privateKey, 'base64');
        return signature;
    } catch (e) {
        console.log('Error: ', e);
        throw new Error('Internal error');
    }
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a Wallet
 */
app.post('/create-wallet', async (req: Request, res: Response) => {
    try {
        console.log("[Swiss Provider] /create-wallet", req.headers, req.body);

        const serviceRequest = await createWallet(req.body).catch(err => {
            console.error(err);
            res.status(500);
        });
        console.log("[Swiss Provider] createWallet  ", serviceRequest.requestId);

        await submitServiceRequest(serviceRequest.requestId);
        await makerApproveRequest(serviceRequest.requestId);
        await delay(3000);
        await checkerApproveRequest(serviceRequest.requestId);

        res.status(200).json({
            id: serviceRequest.pluginDetail.entityId
        });
    } catch (error) {
        console.error(error);
        res.status(500);
    }
});

interface CreateTransferRequest {
    amount: string;
    currency: string;
    subtractFee: boolean;
    sender: TransferWalletData;
    destination: TransferWalletData;
}

interface TransferWalletData {
    type: string;
    value: string;
}

async function createTransfer(fromWallet: string, toAddress: string, amount: string, currency: string): Promise<any> {

    console.log('[Swiss Provider] find beneficiary address Id ', toAddress);

    const addressRequest = {
        addresses: [toAddress]
    }

    const beneficiaryAddressResponse = await apiCall(`${DEFAULT_ENDPOINT}/v3/api/netwmgmt/addresses`, MAKER_ID, addressRequest);
    console.log('beneficiaryAddressResponse ', beneficiaryAddressResponse);

    if (beneficiaryAddressResponse.items === undefined || beneficiaryAddressResponse.items.length == 0) {
        throw new Error('address not whitelisted!');
    }

    const sender: TransferWalletData = {
        type: 'WALLETID',
        value: fromWallet
    }


    const destination: TransferWalletData = {
        type: 'BENEFICIARYADDRESSID',
        value: beneficiaryAddressResponse.items[0].cryptoAddressId
    }

    const payload: CreateTransferRequest = {
        amount: amount,
        sender: sender,
        destination: destination,
        currency: currency,
        subtractFee: false
    }

    const request: ServiceDeskRequest<CreateTransferRequest> = {
        serviceId: '0x0014-007',
        payload: payload
    };

    console.log(payload)

    const url = `${DEFAULT_ENDPOINT}/v3/api/servicedesk/create`

    const response = await apiCall(url, MAKER_ID, request);

    return response;
}

app.post('/create-transfer', async (req: Request, res: Response) => {
    try {
        console.log("[Swiss Provider] create-transfer", req.headers, req.body);
        const fromWallet = req.body.fromWallet
        const toAddress = req.body.toAddress
        const currency = req.body.currency
        const amount = req.body.amount

        console.log("[Swiss Provider] fromWallet", fromWallet, "toAddress", toAddress, "amount", amount, "currency", currency);

        const serviceRequest = await createTransfer(fromWallet, toAddress, amount, currency);
        console.log("[Swiss Provider] create transfer requestId  ", serviceRequest.requestId);

        await submitServiceRequest(serviceRequest.requestId);
        await makerApproveRequest(serviceRequest.requestId);
        await delay(3000);
        await checkerApproveRequest(serviceRequest.requestId);

        res.status(200).json({
            id: serviceRequest.pluginDetail.entityId
        });
    } catch (error) {
        console.error(error)
        res.status(500);
    }
});

app.listen(PORT, () => {
    console.log(`[Swiss Provider Service] is running on port ${PORT}`);
});
