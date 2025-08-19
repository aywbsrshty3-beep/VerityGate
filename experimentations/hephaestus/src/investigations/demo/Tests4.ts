import { randomBytes } from 'crypto';

function generateUuid(length: number): string {
    if (length <= 0) {
        throw new Error('Length must be a positive integer.');
    }

    const bytesNeeded = Math.ceil(length / 2);
    const bytes = randomBytes(bytesNeeded);
    const hex = bytes.toString('hex').slice(0, length);
    return hex;
}

function calculateCollisionProbability(length: number): number {
    const possibleUuids = Math.pow(16, length);
    console.log("possibleUuids", possibleUuids);
    const numberOfUuids = Math.pow(2, 128); // Assuming you'll generate a lot of UUIDs
    console.log("numberOfUuids", numberOfUuids);
    const probability = 1 - Math.exp(-(numberOfUuids * (numberOfUuids - 1)) / (2 * possibleUuids));
    console.log("probability", probability);
    return probability;
}

const length = 16;
console.log(generateUuid(length));
console.log('Collision probability:', calculateCollisionProbability(length));