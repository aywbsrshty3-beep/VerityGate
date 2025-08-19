import { Identifiable } from "./VGTypes";

export function toJSON(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Map) {
      // Convert Map to an array of [key, value] pairs
      return Array.from(value.entries());
    }
    return value; // For other types, return the value as is
  });
}

export function array2map<T extends Identifiable>(
  dao: Array<T>
): Map<string, T> {
  return dao.reduce((map, dao) => {
    map.set(dao.id, dao);
    return map;
  }, new Map<string, T>());
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