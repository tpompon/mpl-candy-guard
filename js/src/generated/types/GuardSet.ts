/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet';
import { BotTax, botTaxBeet } from './BotTax';
import { SolPayment, solPaymentBeet } from './SolPayment';
import { TokenPayment, tokenPaymentBeet } from './TokenPayment';
import { StartDate, startDateBeet } from './StartDate';
import { ThirdPartySigner, thirdPartySignerBeet } from './ThirdPartySigner';
import { TokenGate, tokenGateBeet } from './TokenGate';
import { Gatekeeper, gatekeeperBeet } from './Gatekeeper';
import { EndDate, endDateBeet } from './EndDate';
import { AllowList, allowListBeet } from './AllowList';
import { MintLimit, mintLimitBeet } from './MintLimit';
import { NftPayment, nftPaymentBeet } from './NftPayment';
import { RedeemedAmount, redeemedAmountBeet } from './RedeemedAmount';
import { AddressGate, addressGateBeet } from './AddressGate';
import { NftGate, nftGateBeet } from './NftGate';
import { NftBurn, nftBurnBeet } from './NftBurn';
import { TokenBurn, tokenBurnBeet } from './TokenBurn';
export type GuardSet = {
  botTax: beet.COption<BotTax>;
  solPayment: beet.COption<SolPayment>;
  tokenPayment: beet.COption<TokenPayment>;
  startDate: beet.COption<StartDate>;
  thirdPartySigner: beet.COption<ThirdPartySigner>;
  tokenGate: beet.COption<TokenGate>;
  gatekeeper: beet.COption<Gatekeeper>;
  endDate: beet.COption<EndDate>;
  allowList: beet.COption<AllowList>;
  mintLimit: beet.COption<MintLimit>;
  nftPayment: beet.COption<NftPayment>;
  redeemedAmount: beet.COption<RedeemedAmount>;
  addressGate: beet.COption<AddressGate>;
  nftGate: beet.COption<NftGate>;
  nftBurn: beet.COption<NftBurn>;
  tokenBurn: beet.COption<TokenBurn>;
};

/**
 * @category userTypes
 * @category generated
 */
export const guardSetBeet = new beet.FixableBeetArgsStruct<GuardSet>(
  [
    ['botTax', beet.coption(botTaxBeet)],
    ['solPayment', beet.coption(solPaymentBeet)],
    ['tokenPayment', beet.coption(tokenPaymentBeet)],
    ['startDate', beet.coption(startDateBeet)],
    ['thirdPartySigner', beet.coption(thirdPartySignerBeet)],
    ['tokenGate', beet.coption(tokenGateBeet)],
    ['gatekeeper', beet.coption(gatekeeperBeet)],
    ['endDate', beet.coption(endDateBeet)],
    ['allowList', beet.coption(allowListBeet)],
    ['mintLimit', beet.coption(mintLimitBeet)],
    ['nftPayment', beet.coption(nftPaymentBeet)],
    ['redeemedAmount', beet.coption(redeemedAmountBeet)],
    ['addressGate', beet.coption(addressGateBeet)],
    ['nftGate', beet.coption(nftGateBeet)],
    ['nftBurn', beet.coption(nftBurnBeet)],
    ['tokenBurn', beet.coption(tokenBurnBeet)],
  ],
  'GuardSet',
);
