export interface CreateUserActionSignaturePayload {
    userActionPayload: string;
    userActionHttpMethod: string;
    userActionHttpPath: string;
}

export interface ClientData {
    type: string;
    challenge: string;
    origin: string;
    crossOrigin: boolean
}

export interface CredentialAssertion {
    credId: string;
    clientData: string;
    signature: string;
}

export interface FirstFactor {
    kind: string;
    credentialAssertion: CredentialAssertion
}

export interface UserActionSignature {
    challengeIdentifier: string;
    firstFactor: FirstFactor;
}