**Simplified Logic (Updated):**
*   All operations adding funds that should affect the calculated balance (purchases, refunds, converted bonuses) should be recorded with `type = 'MONEY_INCOME'`.
*   All operations subtracting funds (service usage) should be recorded with `type = 'MONEY_OUTCOME'`.
*   Records with `type = 'BONUS'` **ARE IGNORED** by the `get_user_balance` SQL function. If bonuses should affect the balance, they **MUST** be recorded as `MONEY_INCOME`.
*   **IMPORTANT:** The **current** SQL function `get_user_balance` **ONLY** aggregates balance based on `MONEY_INCOME` (+) and `MONEY_OUTCOME` (-).
*   The `create_system_payment` SQL function **must** use `type = 'MONEY_INCOME'` if the grant should affect the user's spendable balance calculated by `get_user_balance`. Using `type = 'BONUS'` will not increase the balance calculated by this function.

## ⚖️ `getUserBalance.ts`: The Keeper of Stars

This function (@src/core/supabase/getUserBalance.ts) **calls the SQL function `get_user_balance`**. The accuracy of the returned balance depends entirely on how that SQL function interprets the `operation_type` enum values in the `payments_v2` table. **Currently, the SQL function `get_user_balance` ONLY considers `MONEY_INCOME` (adds) and `MONEY_OUTCOME` (subtracts), explicitly IGNORING the `BONUS` type.** It uses caching to reduce database load.

## 🛡️ Preventing Negative Balances and Handling Expenses

- **Operation Type Dictates Sign**: The `type` field (`MONEY_INCOME`, `MONEY_OUTCOME`) determines the sign in the `get_user_balance` SQL function. The `BONUS` type is ignored by this function.
- **CRITICAL: No Negative Balances EVER**: The system MUST ensure that a user's final balance **NEVER drops below zero**.
- **Mandatory Pre-check**: Before performing ANY `MONEY_OUTCOME` operation, the system **MUST always check** if the user has sufficient funds using `getUserBalance`.
- **Reject if Insufficient**: If funds are insufficient (balance as calculated by `get_user_balance` is less than cost), the `MONEY_OUTCOME` operation **MUST be rejected gracefully**, and **NO** `payments_v2` entry for the expense should occur.
- **Database Integrity**: Constraints/triggers can be a final safeguard but rely on application logic first.

## 🛠️ PostgreSQL Function: `create_system_payment`

- **Purpose**: Manually grant subscriptions or add funds via a system operation.
- **Location**: Needs to be created/edited manually in the **Supabase SQL Editor**.
- **CRITICAL**: Ensure this function inserts into `payments_v2` with `type = 'MONEY_INCOME'` if the funds should be counted by `get_user_balance`. Using `type = 'BONUS'` will *not* increase the balance calculated by `get_user_balance`. Correctly set `subscription_type` (text) when granting a subscription (leaving `service_type` as `NULL`). 