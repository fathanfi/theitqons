-- Add username, password, and email columns to teachers table
ALTER TABLE teachers
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN password TEXT,
ADD COLUMN email TEXT UNIQUE;

-- Update user_roles to include 'teacher' role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher';

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Add trigger to ensure username uniqueness
CREATE OR REPLACE FUNCTION check_username_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM teachers 
    WHERE username = NEW.username 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Username must be unique';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_username_unique
BEFORE INSERT OR UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION check_username_unique();

-- Add trigger to ensure email uniqueness
CREATE OR REPLACE FUNCTION check_email_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM teachers 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email must be unique';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_email_unique
BEFORE INSERT OR UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION check_email_unique();

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Enable read access for authenticated users" ON user_roles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON user_roles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a function to handle role assignment
CREATE OR REPLACE FUNCTION assign_user_role(p_user_id UUID, p_role_name user_role)
RETURNS void AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, p_role_name)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = p_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 