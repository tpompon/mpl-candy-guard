use anchor_lang::error_code;

#[error_code]
pub enum CandyGuardError {
    #[msg("Could not save guard to account")]
    InvalidAccountSize,
    #[msg("Could not deserialize guard")]
    DeserializationError,
    #[msg("Public key mismatch")]
    PublicKeyMismatch,
    #[msg("Missing expected remaining account")]
    DataIncrementLimitExceeded,
    #[msg("Account does not have correct owner")]
    IncorrectOwner,
    #[msg("Account is not initialized")]
    Uninitialized,
    #[msg("Missing expected remaining account")]
    MissingRemainingAccount,
    #[msg("Numerical overflow error")]
    NumericalOverflowError,
    #[msg("Missing required group label")]
    RequiredGroupLabelNotFound,
    #[msg("Group not found")]
    GroupNotFound,
    #[msg("Group not found")]
    LabelExceededLength,
    #[msg("Candy machine is empty")]
    CandyMachineEmpty,
    #[msg("No instruction was found")]
    InstructionNotFound,
    // collection
    #[msg("Collection public key mismatch")]
    CollectionKeyMismatch,
    #[msg("Missing collection accounts")]
    MissingCollectionAccounts,
    #[msg("Collection update authority public key mismatch")]
    CollectionUpdateAuthorityKeyMismatch,
    // bot tax
    #[msg("Mint must be the last instructions of the transaction")]
    MintNotLastTransaction,
    // live date
    #[msg("Mint is not live")]
    MintNotLive,
    // native price
    #[msg("Not enough SOL to pay for the mint")]
    NotEnoughSOL,
    // token burn
    #[msg("Token burn failed")]
    TokenBurnFailed,
    // token burn/gate/payment
    #[msg("Not enough tokens on the account")]
    NotEnoughTokens,
    // token payment
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    // third-party signer
    #[msg("A signature was required but not found")]
    MissingRequiredSignature,
    // gatekeeper
    #[msg("Gateway token is not valid")]
    GatewayTokenInvalid,
    // end date
    #[msg("Current time is after the set end date")]
    AfterEndDate,
    // allow list
    #[msg("Current time is not within the allowed mint time")]
    InvalidMintTime,
    #[msg("Address not found on the allowed list")]
    AddressNotFoundInAllowedList,
    #[msg("Missing allowed list proof")]
    MissingAllowedListProof,
    #[msg("Allow list guard is not enabled")]
    AllowedListNotEnabled,
    // mint limit
    #[msg("The maximum number of allowed mints was reached")]
    AllowedMintLimitReached,
    // nft burn/gate/payment
    #[msg("Invalid NFT collection")]
    InvalidNftCollection,
    // nft burn/gate/payment
    #[msg("Missing NFT on the account")]
    MissingNft,
    // redeemed amount
    #[msg("Current redemeed items is at the set maximum amount")]
    MaximumRedeemedAmount,
    // authority only
    #[msg("Address not authorized")]
    AddressNotAuthorized,
}
