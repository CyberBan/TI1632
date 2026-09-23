/*
# Make candle prayers private (owner-only)

## Changes
- `candle_prayers` SELECT policy changed from public to owner-scoped.
  Previously anyone could see all prayers; now only the author sees their own.

## Security
- SELECT: auth.uid() = user_id (owner-only)
- INSERT/DELETE: already owner-scoped, unchanged
*/

DROP POLICY IF EXISTS "auth_select_candle_prayers" ON candle_prayers;

CREATE POLICY "auth_select_own_prayers" ON candle_prayers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
