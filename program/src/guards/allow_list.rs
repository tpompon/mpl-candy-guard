use solana_program::{program::invoke_signed, system_instruction};

use crate::{
    instructions::Route,
    utils::{assert_keys_equal, assert_owned_by},
};

use super::*;

/// Guard that uses a merkle tree to specify the addresses allowed to mint.
///
/// List of accounts required:
///
///   0. `[]` Pda created by the merkle proof instruction (seeds `["allow_list", merke tree root, 
///           payer key, candy guard pubkey, candy machine pubkey]`).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AllowList {
    /// Merkle root of the addresses allowed to mint.
    pub merkle_root: [u8; 32],
}

impl AllowList {
    /// Returns true if a `leaf` can be proved to be a part of a Merkle tree
    /// defined by `root`. For this, a `proof` must be provided, containing
    /// sibling hashes on the branch from the leaf to the root of the tree. Each
    /// pair of leaves and each pair of pre-images are assumed to be sorted.
    fn verify(proof: &[[u8; 32]], root: &[u8; 32], leaf: &[u8; 32]) -> bool {
        let mut computed_hash = *leaf;
        for proof_element in proof.iter() {
            if computed_hash <= *proof_element {
                // hash (current computed hash + current element of the proof)
                computed_hash = solana_program::keccak::hashv(&[&computed_hash, proof_element]).0
            } else {
                // hash (current element of the proof + current computed hash)
                computed_hash = solana_program::keccak::hashv(&[proof_element, &computed_hash]).0;
            }
        }
        // check if the computed hash (root) is equal to the provided root
        computed_hash == *root
    }
}

impl Guard for AllowList {
    fn size() -> usize {
        32 // merkle_root
    }

    fn mask() -> u64 {
        0b1u64 << 8
    }

    /// Instruction to validate an address against the merkle tree.
    ///
    /// List of accounts required:
    ///
    ///   0. `[writable]` Pda to represent the merkle proof (seeds `["allow_list", merke tree root,
    ///                   payer key, candy guard pubkey, candy machine pubkey]`).
    ///   1. `[]` System program account.
    fn instruction<'info>(
        ctx: &Context<'_, '_, '_, 'info, Route<'info>>,
        guard_set: &GuardSet,
        data: Vec<u8>,
    ) -> Result<()> {
        msg!("AllowList: validate proof instruction");

        // validates the proof

        let merkle_proof: Vec<[u8; 32]> = if let Ok(proof) = Vec::try_from_slice(&data[..]) {
            proof
        } else {
            return err!(CandyGuardError::MissingAllowedListProof);
        };

        let user = ctx.accounts.payer.key();
        let leaf = solana_program::keccak::hashv(&[user.to_string().as_bytes()]);

        let merkle_root = if let Some(allow_list) = &guard_set.allow_list {
            &allow_list.merkle_root
        } else {
            return err!(CandyGuardError::AllowedListNotEnabled);
        };

        if !Self::verify(&merkle_proof[..], merkle_root, &leaf.0) {
            return err!(CandyGuardError::AddressNotFoundInAllowedList);
        }

        // creates the proof PDA

        let candy_guard_key = &ctx.accounts.candy_guard.key();
        let candy_machine_key = &ctx.accounts.candy_machine.key();

        let proof_pda = Self::get_account_info(ctx, 0)?;
        let seeds = [
            b"allow_list",
            &merkle_root[..],
            user.as_ref(),
            candy_guard_key.as_ref(),
            candy_machine_key.as_ref(),
        ];
        let (pda, bump) = Pubkey::find_program_address(&seeds, &crate::ID);

        assert_keys_equal(proof_pda.key, &pda)?;

        if proof_pda.data_is_empty() {
            let signer = [
                b"allow_list",
                &merkle_root[..],
                user.as_ref(),
                candy_guard_key.as_ref(),
                candy_machine_key.as_ref(),
                &[bump],
            ];
            let rent = Rent::get()?;

            invoke_signed(
                &system_instruction::create_account(
                    &ctx.accounts.payer.key(),
                    &pda,
                    rent.minimum_balance(std::mem::size_of::<i64>()),
                    std::mem::size_of::<i64>() as u64,
                    &crate::ID,
                ),
                &[
                    ctx.accounts.payer.to_account_info(),
                    proof_pda.to_account_info(),
                ],
                &[&signer],
            )?;
        } else {
            // if it an existing account, make sure it has the correct ownwer
            assert_owned_by(&proof_pda, &crate::ID)?;
        }

        let mut account_data = proof_pda.try_borrow_mut_data()?;
        let mut proof = AllowListProof::try_from_slice(&account_data)?;
        proof.timestamp = Clock::get()?.unix_timestamp;
        // saves the changes back to the pda
        let data = &mut proof.try_to_vec().unwrap();
        account_data[0..data.len()].copy_from_slice(data);

        Ok(())
    }
}

impl Condition for AllowList {
    fn validate<'info>(
        &self,
        ctx: &Context<'_, '_, '_, 'info, Mint<'info>>,
        _mint_args: &[u8],
        _guard_set: &GuardSet,
        evaluation_context: &mut EvaluationContext,
    ) -> Result<()> {
        let proof_pda = Self::get_account_info(ctx, evaluation_context.account_cursor)?;
        evaluation_context.account_cursor += 1;
        let user = ctx.accounts.payer.key();

        // validates the pda

        let candy_guard_key = &ctx.accounts.candy_guard.key();
        let candy_machine_key = &ctx.accounts.candy_machine.key();

        let seeds = [
            b"allow_list",
            &self.merkle_root[..],
            user.as_ref(),
            candy_guard_key.as_ref(),
            candy_machine_key.as_ref(),
        ];
        let (pda, _) = Pubkey::find_program_address(&seeds, &crate::ID);

        assert_keys_equal(proof_pda.key, &pda)?;

        if proof_pda.data_is_empty() {
            return err!(CandyGuardError::MissingAllowedListProof);
        }

        assert_owned_by(proof_pda, &crate::ID)?;

        Ok(())
    }
}

/// PDA to track whether an address has been validated or not.
#[account]
#[derive(Default)]
pub struct AllowListProof {
    pub timestamp: i64,
}
