/*
# Add admin role and user banning

## Changes
- `profiles` — added `role` (user/admin) and `banned` (bool) columns
  - `role` and `banned` are NOT client-writable (column privileges revoked)
  - A trigger sets role='admin' on INSERT when display_name='adminVlas'
    (only if no admin exists yet, so the first adminVlas becomes admin)
- `set_user_banned()` — SECURITY DEFINER function, admin-only, to ban/unban users

## Security
- UPDATE on `role` and `banned` columns revoked from authenticated
  (users cannot self-promote or self-unban)
- Only the admin check inside the SECURITY DEFINER function can change `banned`
- The trigger runs as owner, bypassing the client's inability to set `role`
*/

-- Add columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- Revoke table-wide UPDATE, grant only user-editable columns
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_emoji, max_balance, total_won, spins) ON profiles TO authenticated;

-- Trigger: set admin role on insert when display_name = 'adminVlas'
CREATE OR REPLACE FUNCTION set_admin_role_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.display_name = 'adminVlas'
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
  THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_admin_on_insert ON profiles;
CREATE TRIGGER profiles_set_admin_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_admin_role_on_insert();

-- SECURITY DEFINER: admin-only ban/unban
CREATE OR REPLACE FUNCTION set_user_banned(p_user_id uuid, p_banned boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  UPDATE profiles SET banned = p_banned WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_banned(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION set_user_banned(uuid, boolean) TO authenticated;


-- SECURITY DEFINER: permanently delete a user account (admin-only).
-- The client never receives service-role privileges; authorization is checked here.
CREATE OR REPLACE FUNCTION delete_user_admin(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Cannot delete another admin';
  END IF;

  -- These tables do not all have ON DELETE CASCADE, so clean up user data first.
  DELETE FROM public.homework WHERE user_id = p_user_id;
  DELETE FROM public.slots_state WHERE user_id = p_user_id;
  DELETE FROM public.candle_prayers WHERE user_id = p_user_id;

  -- slot_reactions has ON DELETE CASCADE for auth.users references.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION delete_user_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_admin(uuid) TO authenticated;
