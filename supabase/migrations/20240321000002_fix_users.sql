-- First, let's clean up any existing users and roles
DELETE FROM auth.identities WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM auth.users WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
DELETE FROM user_roles WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.assign_admin_role(text);

-- Create a function to handle role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Default role is 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a simple function to assign admin role
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text) TO service_role;

-- Create users with proper auth setup
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'fathanrbe@gmail.com',
    crypt('adminitqon2025', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'fathandeveloper@gmail.com',
    crypt('itqon2025', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  );

-- Create identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"fathanrbe@gmail.com"}',
    'email',
    'fathanrbe@gmail.com',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"fathandeveloper@gmail.com"}',
    'email',
    'fathandeveloper@gmail.com',
    now(),
    now(),
    now()
  );

-- Assign roles
INSERT INTO user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'user');

-- Verify setup
DO $$
BEGIN
  -- Check if users exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fathanrbe@gmail.com') THEN
    RAISE EXCEPTION 'Admin user not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fathandeveloper@gmail.com') THEN
    RAISE EXCEPTION 'Regular user not created';
  END IF;

  -- Check if identities exist
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'fathanrbe@gmail.com') THEN
    RAISE EXCEPTION 'Admin identity not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'fathandeveloper@gmail.com') THEN
    RAISE EXCEPTION 'Regular user identity not created';
  END IF;

  -- Check if roles are assigned
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001' AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin role not assigned';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000002' AND role = 'user') THEN
    RAISE EXCEPTION 'Regular user role not assigned';
  END IF;
END $$; 