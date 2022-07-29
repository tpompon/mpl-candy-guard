use super::*;

use solana_program::{program::invoke, system_instruction};

use crate::errors::CandyGuardError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LamportsCharge {
    pub amount: u64,
}

impl Guard for LamportsCharge {
    fn size() -> usize {
        std::mem::size_of::<u64>() // date
    }

    fn mask() -> u64 {
        0x8u64
    }
}

impl Condition for LamportsCharge {
    fn evaluate<'info>(
        &self,
        ctx: &Context<'_, '_, '_, 'info, Mint<'info>>,
        _candy_guard_data: &CandyGuardData,
        evaluation_context: &mut EvaluationContext,
    ) -> Result<()> {
        evaluation_context.amount = self.amount;

        if ctx.accounts.payer.lamports() < evaluation_context.amount {
            msg!(
                "Require {} lamports, accounts has {} lamports",
                evaluation_context.amount,
                ctx.accounts.payer.lamports(),
            );
            return err!(CandyGuardError::NotEnoughSOL);
        }

        invoke(
            &system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &ctx.accounts.wallet.key(),
                evaluation_context.amount,
            ),
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}
