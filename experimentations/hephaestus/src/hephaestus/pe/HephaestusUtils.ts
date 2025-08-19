import {Identifiable} from './HephaestusTypes';
import axios from 'axios';
import { randomBytes } from 'crypto';

export function array2map<T extends Identifiable>(dao: Array<T>): Map<string, T> {
    return dao.reduce((map, dao) => {
              map.set(dao.id, dao);
              return map;
            }, new Map<string, T>());
}

export function map2json(key:string, value:any) {
    if(value instanceof Map) {
        const jsonObject = Object.fromEntries(value);
        // const jsonString = JSON.stringify(jsonObject);
        return jsonObject;
    } else {
        return value;
    }
}

const defaultLength = 16;
export function genId(prefix: string): string {
    const bytesNeeded = Math.ceil(defaultLength / 2);
    const bytes = randomBytes(bytesNeeded);
    const hex = bytes.toString('hex').slice(0, defaultLength);
    return (prefix + "-" + hex).toLowerCase();
}

function headers() {
    return {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json',
        'User-Agent': 'TJ/1.0',
    }
}

export async function post(url: string, data: any): Promise<any> {
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

export async function get(url: string): Promise<any> {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        // Handle error here
        console.error('Error invoking REST service:', error);
        throw error;
    }
}

export function toBase64Url(buffer: Buffer | Uint8Array): string {
    let base64 = Buffer.from(buffer).toString('base64');
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64;
}

export function fromBase64Url(base64Url: string): Uint8Array {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64');
}