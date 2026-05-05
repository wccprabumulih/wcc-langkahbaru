-- ============================================================
-- WCC Langkah Baru — Supabase RBAC Setup
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Buat tabel profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- User hanya bisa baca profil sendiri
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- User bisa update profil sendiri (tapi BUKAN kolom role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Service role (backend) bisa lakukan semua operasi
CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Trigger: auto-buat profil dengan role='user' saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger lama kalau ada, lalu buat baru
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. (Opsional) Set akun kamu jadi admin — ganti EMAIL_KAMU dengan email admin
-- UPDATE public.profiles
--   SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_KAMU');

-- Verifikasi setup
SELECT 'Profiles table created' AS status;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
