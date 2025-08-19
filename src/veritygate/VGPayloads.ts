import { Identifiable } from "./VGTypes";

/**
 * TransferOutPayload interface
 */
export interface TransferOutPayload extends Identifiable {
  fromWallet: string;
  toWallet: string;
  amount: string;
  // TODO Add dyanmic a USD equivalent amount
  meta?: Map<string, string | number>;
}
