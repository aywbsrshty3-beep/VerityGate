enum BorrowerRisk {
    A, B, C, D
}
enum AssetRisk {
    A, B, C, D
}

interface Borrower {
}

interface Lender {
    allowedBorrowerRisk: BorrowerRisk; // If B, A & B, if A, A, etc.
    allowedAssetRisk: AssetRisk;
    duration: Map<string, number>; // AA = 30 days, AB = 10 days
    interest: Map<string, number>; // AA = 10%, AB = 12%
}