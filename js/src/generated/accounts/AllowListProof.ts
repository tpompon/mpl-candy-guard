/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet';
import * as web3 from '@solana/web3.js';
import * as beetSolana from '@metaplex-foundation/beet-solana';

/**
 * Arguments used to create {@link AllowListProof}
 * @category Accounts
 * @category generated
 */
export type AllowListProofArgs = {
  timestamp: beet.bignum;
};

export const allowListProofDiscriminator = [19, 122, 207, 114, 207, 43, 233, 148];
/**
 * Holds the data for the {@link AllowListProof} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class AllowListProof implements AllowListProofArgs {
  private constructor(readonly timestamp: beet.bignum) {}

  /**
   * Creates a {@link AllowListProof} instance from the provided args.
   */
  static fromArgs(args: AllowListProofArgs) {
    return new AllowListProof(args.timestamp);
  }

  /**
   * Deserializes the {@link AllowListProof} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0,
  ): [AllowListProof, number] {
    return AllowListProof.deserialize(accountInfo.data, offset);
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link AllowListProof} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
  ): Promise<AllowListProof> {
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo == null) {
      throw new Error(`Unable to find AllowListProof account at ${address}`);
    }
    return AllowListProof.fromAccountInfo(accountInfo, 0)[0];
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey('Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g'),
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, allowListProofBeet);
  }

  /**
   * Deserializes the {@link AllowListProof} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [AllowListProof, number] {
    return allowListProofBeet.deserialize(buf, offset);
  }

  /**
   * Serializes the {@link AllowListProof} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return allowListProofBeet.serialize({
      accountDiscriminator: allowListProofDiscriminator,
      ...this,
    });
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link AllowListProof}
   */
  static get byteSize() {
    return allowListProofBeet.byteSize;
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link AllowListProof} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment,
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(AllowListProof.byteSize, commitment);
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link AllowListProof} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === AllowListProof.byteSize;
  }

  /**
   * Returns a readable version of {@link AllowListProof} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      timestamp: (() => {
        const x = <{ toNumber: () => number }>this.timestamp;
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
    };
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const allowListProofBeet = new beet.BeetStruct<
  AllowListProof,
  AllowListProofArgs & {
    accountDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['timestamp', beet.i64],
  ],
  AllowListProof.fromArgs,
  'AllowListProof',
);
