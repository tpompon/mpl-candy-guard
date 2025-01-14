use super::*;

/// Guard that sets a specific start date for the mint.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StartDate {
    pub date: i64,
}

impl Guard for StartDate {
    fn size() -> usize {
        8 // date
    }

    fn mask() -> u64 {
        0b1u64 << 3
    }
}

impl Condition for StartDate {
    fn validate<'info>(
        &self,
        _ctx: &Context<'_, '_, '_, 'info, Mint<'info>>,
        _mint_args: &[u8],
        _guard_set: &GuardSet,
        _evaluation_context: &mut EvaluationContext,
    ) -> Result<()> {
        let clock = Clock::get()?;

        if clock.unix_timestamp < self.date {
            return err!(CandyGuardError::MintNotLive);
        }

        Ok(())
    }
}
