# Providers Integration

## DFNS

- https://app.dfns.ninja/
- Service Account ...
- Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQ...
- App id: ap-42qu7-ouhuu-8tr9sq2knl4h...

## Initiate Challenge via cURL
```cmd
curl -v -H 'Accept: application/json' \
     -H 'Content-Type: application/json' \
     -H 'X-DFNS-APPID: ap-42qu7-ouhuu-8tr9sq2knl...' \
     -H 'X-DFNS-NONCE: {"uuid":"9d93f569-a9a1-4c67-bcb4-28cf8ea68539","date":"2024-09-24T03:16:01.392Z"}' \
     -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFZ...' \
     -X POST \
     -d @ua.json \
     https://api.dfns.ninja/auth/action/init
```

ua.json
```json
{
	"userActionHttpMethod": "POST",
	"userActionHttpPath": "/wallets",
	"userActionPayload": "{\"name\":\"tjs-wallet-1\",\"network\":\"EthereumGoerli\"}"
}
```

### Open SSL
```shell
# Generate RSA Private Key
openssl genrsa -out approver-rsa2048.pem 2048
# Generate the Public Key
openssl pkey -in approver-rsa2048.pem -pubout -out approver-rsa2048.public.pem
```

### Wallet Transfer Test

```json
     {
        "id": "wa-1ol09-a00l3-9e1p9meafj5q609u",
        "network": "EthereumSepolia",
        "status": "Active",
        "signingKey": {},
        "address": "0x4c762342bdd28fefe37cedacbc6ca04161689fed",
        "name": "ETH-WALLET-0",
        "dateCreated": "2024-09-26T10:07:05.167Z",
        "custodial": true,
        "tags": []
      }
```

https://sepolia.etherscan.io/address/0x4c762342bdd28fefe37cedacbc6ca04161689fed

Shows:
- 0.057755169262753344 ETH
- 57755169262753340 WEIS

Tft out: 100000000000000

```json
{
  id: 'xfr-2uvi3-fd5or-9tiotb6k6rfl1gfr',
  walletId: 'wa-1ol09-a00l3-9e1p9meafj5q609u',
  network: 'EthereumSepolia',
  requester: {
    userId: 'us-6k44q-aoigv-99084ek3h0drc5ia',
    tokenId: 'to-6eep3-0gsqv-9aabtf3c7ohiio6p',
    appId: 'ap-42qu7-ouhuu-8tr9sq2knl4heb18'
  },
  requestBody: {
    kind: 'Native',
    to: '0x8c182d6c273802081f1afc511a752167d318c3f7',
    amount: '100000000000000'
  },
  metadata: { asset: { symbol: 'SepoliaETH', decimals: 18, quotes: {} } },
  status: 'Pending',
  dateRequested: '2024-10-08T10:04:56.020Z',
  approvalId: 'ap-1od0c-9qqq8-8e3op2gm1rle980n'
}
```

```json
 {
      id: 'xfr-2uvi3-fd5or-9tiotb6k6rfl1gfr',
      walletId: 'wa-1ol09-a00l3-9e1p9meafj5q609u',
      network: 'EthereumSepolia',
      requester: [Object],
      requestBody: [Object],
      metadata: [Object],
      status: 'Executing',
      dateRequested: '2024-10-08T10:04:56.020Z',
      datePolicyResolved: '2024-10-08T10:05:55.628Z',
      approvalId: 'ap-1od0c-9qqq8-8e3op2gm1rle980n'
    }
```