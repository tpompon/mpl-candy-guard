use anchor_lang::{prelude::*, AnchorDeserialize};
use solana_program::program_memory::sol_memcmp;

use crate::{errors::CandyGuardError, guards::*};
use mpl_candy_guard_derive::GuardSet;

// Bytes offset for the start of the data section:
//     8 (discriminator)
//  + 32 (base)
//  +  1 (bump)
//  + 32 (authority)
pub const DATA_OFFSET: usize = 8 + 32 + 1 + 32;

// Maximim group label size.
pub const MAX_LABEL_SIZE: usize = 6;

// Seed value for PDA.
pub const SEED: &[u8] = b"candy_guard";

#[account]
#[derive(Default)]
pub struct CandyGuard {
    // Base key used to generate the PDA
    pub base: Pubkey,
    // Bump seed
    pub bump: u8,
    // Authority of the guard
    pub authority: Pubkey,
    // after this there is a flexible amount of data to serialize
    // data (CandyGuardData struct) of the available guards; the size
    // of the data is adjustable as new guards are implemented (the
    // account is resized using realloc)
    //
    // available guards:
    //  1) bot tax
    //  2) sol payment
    //  3) token payment
    //  4) start date
    //  5) third party signer
    //  6) token gate
    //  7) gatekeeper
    //  8) end date
    //  9) allow list
    // 10) mint limit
    // 11) nft payment
    // 12) redeemed amount
    // 13) address gate
    // 14) nft gate
    // 15) nft burn
    // 16) token burn
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CandyGuardData {
    pub default: GuardSet,
    pub groups: Option<Vec<Group>>,
}

/// A group represent a specific set of guards. When groups are used, transactions
/// must specify which group should be used during validation.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Group {
    pub label: String,
    pub guards: GuardSet,
}

/// The set of guards available.
#[derive(GuardSet, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct GuardSet {
    /// Last instruction check and bot tax (penalty for invalid transactions).
    pub bot_tax: Option<BotTax>,
    /// Sol payment guard (set the price for the mint in lamports).
    pub sol_payment: Option<SolPayment>,
    /// Token payment guard (set the price for the mint in spl-token amount).
    pub token_payment: Option<TokenPayment>,
    /// Start data guard (controls when minting is allowed).
    pub start_date: Option<StartDate>,
    /// Third party signer guard (requires an extra signer for the transaction).
    pub third_party_signer: Option<ThirdPartySigner>,
    /// Token gate guard (restrict access to holders of a specific token).
    pub token_gate: Option<TokenGate>,
    /// Gatekeeper guard (captcha challenge).
    pub gatekeeper: Option<Gatekeeper>,
    /// End date guard (set an end date to stop the mint).
    pub end_date: Option<EndDate>,
    /// Allow list guard (curated list of allowed addresses).
    pub allow_list: Option<AllowList>,
    /// Mint limit guard (add a limit on the number of mints per wallet).
    pub mint_limit: Option<MintLimit>,
    /// NFT Payment (charge an NFT in order to mint).
    pub nft_payment: Option<NftPayment>,
    /// Redeemed amount guard (add a limit on the overall number of items minted).
    pub redeemed_amount: Option<RedeemedAmount>,
    /// Address gate (check access against a specified address).
    pub address_gate: Option<AddressGate>,
    /// NFT gate guard (check access based on holding a specified NFT).
    pub nft_gate: Option<NftGate>,
    /// NFT burn guard (burn a specified NFT).
    pub nft_burn: Option<NftBurn>,
    /// Token burn guard (burn a specified amount of spl-token).
    pub token_burn: Option<TokenBurn>,
}

/// Available guard types.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum GuardType {
    BotTax,
    SolPayment,
    TokenPayment,
    StartDate,
    ThirdPartySigner,
    TokenGate,
    Gatekeeper,
    EndDate,
    AllowList,
    MintLimit,
    NftPayment,
    RedeemedAmount,
    AddressGate,
    NftGate,
    NftBurn,
    TokenBurn,
}

impl CandyGuardData {
    /// Serialize the candy guard data into the specified data array.
    pub fn save(&self, data: &mut [u8]) -> Result<()> {
        let mut cursor = 0;

        // saves the 'default' guard set
        let _ = self.default.to_data(data)?;
        cursor += self.default.size();

        // stores the number of 'groups' guard set
        let group_counter = if let Some(groups) = &self.groups {
            groups.len() as u32
        } else {
            0
        };
        data[cursor..cursor + 4].copy_from_slice(&u32::to_le_bytes(group_counter));
        cursor += 4;

        // saves each individual 'groups' guard set
        if let Some(groups) = &self.groups {
            for group in groups {
                // label
                if group.label.len() > MAX_LABEL_SIZE {
                    return err!(CandyGuardError::LabelExceededLength);
                }
                data[cursor..cursor + group.label.len()].copy_from_slice(group.label.as_bytes());
                cursor += MAX_LABEL_SIZE;
                // guard set
                let _ = group.guards.to_data(&mut data[cursor..])?;
                cursor += group.guards.size();
            }
        }

        Ok(())
    }

    /// Deserializes the guards. Only attempts the deserialization of individuals guards
    /// if the data slice is large enough.
    pub fn load(data: &[u8]) -> Result<Box<Self>> {
        let (default, _) = GuardSet::from_data(data)?;
        let mut cursor = default.size();

        let group_counter = u32::from_le_bytes(*arrayref::array_ref![data, cursor, 4]);
        cursor += 4;

        let groups = if group_counter > 0 {
            let mut groups = Vec::with_capacity(group_counter as usize);

            for _i in 0..group_counter {
                let slice: &[u8] = &data[cursor..cursor + MAX_LABEL_SIZE];
                let label = String::from_utf8(slice.to_vec())
                    .map_err(|_| CandyGuardError::DeserializationError)?;
                cursor += MAX_LABEL_SIZE;
                let (guards, _) = GuardSet::from_data(&data[cursor..])?;
                cursor += guards.size();
                groups.push(Group { label, guards });
            }

            Some(groups)
        } else {
            None
        };

        Ok(Box::new(Self { default, groups }))
    }

    pub fn active_set(data: &[u8], label: Option<String>) -> Result<Box<GuardSet>> {
        // default guard set
        let (mut default, _) = GuardSet::from_data(data)?;
        let mut cursor = default.size();

        // number of groups
        let group_counter = u32::from_le_bytes(*arrayref::array_ref![data, cursor, 4]);
        cursor += 4;

        if group_counter > 0 {
            if let Some(label) = label {
                let label_slice = label.as_bytes();
                // retrieves the selected gorup
                for _i in 0..group_counter {
                    if sol_memcmp(label_slice, &data[cursor..], label_slice.len()) == 0 {
                        cursor += MAX_LABEL_SIZE;
                        let (guards, _) = GuardSet::from_data(&data[cursor..])?;
                        default.merge(guards);
                        // we found our group
                        return Ok(Box::new(default));
                    } else {
                        cursor += MAX_LABEL_SIZE;
                        let features = u64::from_le_bytes(*arrayref::array_ref![data, cursor, 8]);
                        cursor += GuardSet::bytes_count(features);
                    }
                }
                return err!(CandyGuardError::GroupNotFound);
            }
            // if we have groups, label is required
            return err!(CandyGuardError::RequiredGroupLabelNotFound);
        } else if label.is_some() {
            return err!(CandyGuardError::GroupNotFound);
        }

        Ok(Box::new(default))
    }

    pub fn size(&self) -> usize {
        let mut size = DATA_OFFSET + self.default.size();
        size += 4; // u32 (number of groups)

        if let Some(groups) = &self.groups {
            size += groups
                .iter()
                .map(|group| MAX_LABEL_SIZE + group.guards.size())
                .sum::<usize>();
        }

        size
    }
}
