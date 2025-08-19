import {
  Wish,
  Actor,
  Org,
  Policy,
  PolicyRule,
  PolicyControl,
  Wallet,
  ControlStructure,
} from "./VGTypes";

/**
 * To be implemented by all service providers: DFNS, Ripple Custody, Fireblocks, Anchorage, ...
 */
export abstract class VGServiceProvider {
  /**
   * Initialises the plug-in
   */
  abstract init(): void;

  /**
   * List all transactions for a given provider wallet id
   * @param walletId Native wallet Ids
   * @returns a list of transactions in json
   */
  abstract walletTransactions(walletId: string): string[];

  /**
   * Lists all the wallets for the current user
   * @returns a list of wallets in json
   */
  abstract wallets(): string[];

  /**
   * Creates a wallet
   * @param payload 
   */
  abstract createWallet(payload: string): void;

  /**
   * Creates a transfer
   * @param payload 
   */
  abstract createTransfer(payload: string): void;
}
