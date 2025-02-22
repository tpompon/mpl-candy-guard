import {
  ConfirmedTransactionAssertablePromise,
  GenLabeledKeypair,
  LoadOrGenKeypair,
  LOCALHOST,
  PayerTransactionHandler,
} from '@metaplex-foundation/amman-client';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
  Transaction,
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  AccountMeta,
} from '@solana/web3.js';
import { Test } from 'tape';
import { amman } from '.';
import {
  CANDY_MACHINE_PROGRAM,
  CandyMachineHelper,
  getCandyGuardPDA,
  METAPLEX_PROGRAM_ID,
} from '../utils';
import {
  CandyGuardData,
  createInitializeInstruction,
  createMintInstruction,
  createUnwrapInstruction,
  createUpdateInstruction,
  createWrapInstruction,
  InitializeInstructionAccounts,
  InitializeInstructionArgs,
  MintInstructionAccounts,
  MintInstructionArgs,
  PROGRAM_ID,
  UnwrapInstructionAccounts,
  UpdateInstructionAccounts,
  UpdateInstructionArgs,
  WrapInstructionAccounts,
} from '../../src/generated';
import { CandyMachine } from '@metaplex-foundation/mpl-candy-machine-core';
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  MintLayout,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  findAssociatedTokenAccountPda,
  findCandyMachineCreatorPda,
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  keypairIdentity,
  Metaplex,
} from '@metaplex-foundation/js';

const HELPER = new CandyMachineHelper();

export class InitTransactions {
  readonly getKeypair: LoadOrGenKeypair | GenLabeledKeypair;
  constructor(readonly resuseKeypairs = false) {
    this.getKeypair = resuseKeypairs ? amman.loadOrGenKeypair : amman.genLabeledKeypair;
  }

  // wallets

  async payer() {
    const [payer, payerPair] = await this.getKeypair('Payer');

    const connection = new Connection(LOCALHOST, 'confirmed');
    await amman.airdrop(connection, payer, 2);

    const transactionHandler = amman.payerTransactionHandler(connection, payerPair);

    return {
      fstTxHandler: transactionHandler,
      connection,
      payer,
      payerPair,
    };
  }

  async authority() {
    const [authority, authorityPair] = await this.getKeypair('Authority');

    const connection = new Connection(LOCALHOST, 'confirmed');
    await amman.airdrop(connection, authority, 2);

    const transactionHandler = amman.payerTransactionHandler(connection, authorityPair);

    return {
      fstTxHandler: transactionHandler,
      connection,
      authority,
      authorityPair,
    };
  }

  async minter() {
    const [minter, minterPair] = await this.getKeypair('Minter');

    const connection = new Connection(LOCALHOST, 'confirmed');
    await amman.airdrop(connection, minter, 2);

    const transactionHandler = amman.payerTransactionHandler(connection, minterPair);

    return {
      fstTxHandler: transactionHandler,
      connection,
      minter,
      minterPair,
    };
  }

  // instructions

  async initialize(
    t: Test,
    data: CandyGuardData,
    payer: Keypair,
    handler: PayerTransactionHandler,
  ): Promise<{ tx: ConfirmedTransactionAssertablePromise; candyGuard: PublicKey }> {
    const [, keypair] = await this.getKeypair('Candy Guard Base Pubkey');
    const pda = await getCandyGuardPDA(PROGRAM_ID, keypair);
    amman.addr.addLabel('Candy Guard Account', pda);

    const accounts: InitializeInstructionAccounts = {
      candyGuard: pda,
      base: keypair.publicKey,
      authority: payer.publicKey,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
    };

    const args: InitializeInstructionArgs = {
      data: data,
    };

    const tx = new Transaction().add(createInitializeInstruction(accounts, args));

    return {
      tx: handler.sendAndConfirmTransaction(tx, [payer, keypair], 'tx: Initialize'),
      candyGuard: pda,
    };
  }

  async wrap(
    t: Test,
    candyGuard: PublicKey,
    candyMachine: PublicKey,
    payer: Keypair,
    handler: PayerTransactionHandler,
  ): Promise<{ tx: ConfirmedTransactionAssertablePromise }> {
    const accounts: WrapInstructionAccounts = {
      candyGuard,
      authority: payer.publicKey,
      candyMachine: candyMachine,
      candyMachineProgram: CANDY_MACHINE_PROGRAM,
      candyMachineAuthority: payer.publicKey,
    };

    const tx = new Transaction().add(createWrapInstruction(accounts));

    return {
      tx: handler.sendAndConfirmTransaction(tx, [payer], 'tx: Wrap'),
    };
  }

  async unwrap(
    t: Test,
    candyGuard: PublicKey,
    candyMachine: PublicKey,
    payer: Keypair,
    handler: PayerTransactionHandler,
  ): Promise<{ tx: ConfirmedTransactionAssertablePromise }> {
    const accounts: UnwrapInstructionAccounts = {
      candyGuard,
      authority: payer.publicKey,
      candyMachine: candyMachine,
      candyMachineProgram: CANDY_MACHINE_PROGRAM,
      candyMachineAuthority: payer.publicKey,
    };

    const tx = new Transaction().add(createUnwrapInstruction(accounts));

    return {
      tx: handler.sendAndConfirmTransaction(tx, [payer], 'tx: Unwrap'),
    };
  }

  async update(
    t: Test,
    candyGuard: PublicKey,
    data: CandyGuardData,
    payer: Keypair,
    handler: PayerTransactionHandler,
  ): Promise<{ tx: ConfirmedTransactionAssertablePromise }> {
    const accounts: UpdateInstructionAccounts = {
      candyGuard,
      authority: payer.publicKey,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
    };

    const args: UpdateInstructionArgs = {
      data,
    };

    const tx = new Transaction().add(createUpdateInstruction(accounts, args));

    return {
      tx: handler.sendAndConfirmTransaction(tx, [payer], 'tx: Update'),
    };
  }

  async mint(
    t: Test,
    candyGuard: PublicKey,
    candyMachine: PublicKey,
    payer: Keypair,
    mint: Keypair,
    handler: PayerTransactionHandler,
    connection: Connection,
    remainingAccounts?: AccountMeta[] | null,
    mintArgs?: Uint8Array | null,
    label?: string | null,
  ): Promise<{ tx: ConfirmedTransactionAssertablePromise }> {
    // candy machine object
    const candyMachineObject = await CandyMachine.fromAccountAddress(connection, candyMachine);

    // PDAs required for the mint
    const nftMetadata = findMetadataPda(mint.publicKey);
    const nftMasterEdition = findMasterEditionV2Pda(mint.publicKey);
    const nftTokenAccount = findAssociatedTokenAccountPda(mint.publicKey, payer.publicKey);

    const collectionMint = candyMachineObject.collectionMint;
    // retrieves the collection nft
    const metaplex = Metaplex.make(connection).use(keypairIdentity(payer));
    const collection = await metaplex.nfts().findByMint({ mintAddress: collectionMint }).run();
    // collection PDAs
    const authorityPda = findCandyMachineCreatorPda(candyMachine, CANDY_MACHINE_PROGRAM);
    const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
      collectionMint,
      authorityPda,
    );
    const collectionMetadata = findMetadataPda(collectionMint);
    const collectionMasterEdition = findMasterEditionV2Pda(collectionMint);

    const accounts: MintInstructionAccounts = {
      candyGuard,
      candyMachineProgram: CANDY_MACHINE_PROGRAM,
      candyMachine,
      payer: payer.publicKey,
      candyMachineAuthorityPda: authorityPda,
      nftMasterEdition: nftMasterEdition,
      nftMetadata,
      nftMint: mint.publicKey,
      nftMintAuthority: payer.publicKey,
      collectionUpdateAuthority: collection.updateAuthorityAddress,
      collectionAuthorityRecord,
      collectionMasterEdition,
      collectionMetadata,
      collectionMint,
      tokenMetadataProgram: METAPLEX_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      recentSlothashes: SYSVAR_SLOT_HASHES_PUBKEY,
      instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
    };

    if (!mintArgs) {
      mintArgs = new Uint8Array();
    }

    const args: MintInstructionArgs = {
      mintArgs,
      label: label ?? null,
    };

    const ixs: TransactionInstruction[] = [];
    ixs.push(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
    ixs.push(createInitializeMintInstruction(mint.publicKey, 0, payer.publicKey, payer.publicKey));
    ixs.push(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        nftTokenAccount,
        payer.publicKey,
        mint.publicKey,
      ),
    );
    ixs.push(createMintToInstruction(mint.publicKey, nftTokenAccount, payer.publicKey, 1, []));

    const mintIx = createMintInstruction(accounts, args);
    if (remainingAccounts) {
      mintIx.keys.push(...remainingAccounts);
    }
    ixs.push(mintIx);

    const tx = new Transaction().add(...ixs);

    return { tx: handler.sendAndConfirmTransaction(tx, [payer, mint], 'tx: Candy Guard Mint') };
  }

  async deploy(
    t: Test,
    guards: CandyGuardData,
    payer: Keypair,
    handler: PayerTransactionHandler,
    connection: Connection,
  ): Promise<{ candyGuard: PublicKey; candyMachine: PublicKey }> {
    // candy machine

    const [, candyMachine] = await amman.genLabeledKeypair('Candy Machine Account');

    const items = 10;

    const candyMachineData = {
      itemsAvailable: items,
      symbol: 'CORE',
      sellerFeeBasisPoints: 500,
      maxSupply: 0,
      isMutable: true,
      retainAuthority: true,
      creators: [
        {
          address: payer.publicKey,
          verified: false,
          percentageShare: 100,
        },
      ],
      configLineSettings: {
        prefixName: 'TEST ',
        nameLength: 10,
        prefixUri: 'https://arweave.net/',
        uriLength: 50,
        isSequential: false,
      },
      hiddenSettings: null,
    };

    const { tx: createTxCM } = await HELPER.initialize(
      t,
      payer,
      candyMachine,
      candyMachineData,
      handler,
      connection,
    );
    // executes the transaction
    await createTxCM.assertSuccess(t);

    const lines: { name: string; uri: string }[] = [];

    for (let i = 0; i < items; i++) {
      const line = {
        name: `NFT #${i + 1}`,
        uri: 'uJSdJIsz_tYTcjUEWdeVSj0aR90K-hjDauATWZSi-tQ',
      };

      lines.push(line);
    }
    const { txs } = await HELPER.addConfigLines(t, candyMachine.publicKey, payer, lines);
    // confirms that all lines have been written
    for (const tx of txs) {
      await handler.sendAndConfirmTransaction(tx, [payer], 'tx: AddConfigLines').assertNone();
    }

    // candy guard

    const { tx: initializeTxCG, candyGuard: address } = await this.initialize(
      t,
      guards,
      payer,
      handler,
    );
    // executes the transaction
    await initializeTxCG.assertSuccess(t);

    const { tx: wrapTx } = await this.wrap(t, address, candyMachine.publicKey, payer, handler);

    await wrapTx.assertSuccess(t, [/SetMintAuthority/i]);

    return { candyGuard: address, candyMachine: candyMachine.publicKey };
  }
}
