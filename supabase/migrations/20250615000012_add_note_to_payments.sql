-- Add note field to payments table
ALTER TABLE payments ADD COLUMN note text;

-- Add comment for the new field
COMMENT ON COLUMN payments.note IS 'Additional notes or comments for the payment'; 