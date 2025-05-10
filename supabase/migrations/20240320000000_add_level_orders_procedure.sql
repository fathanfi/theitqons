-- Create a function to update level orders
CREATE OR REPLACE FUNCTION update_level_orders(
  old_order integer,
  new_order integer,
  level_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the moved level
  UPDATE levels
  SET "order" = new_order
  WHERE id = level_id;

  -- Update other affected levels
  IF new_order > old_order THEN
    UPDATE levels
    SET "order" = "order" - 1
    WHERE "order" >= old_order + 1
    AND "order" <= new_order
    AND id != level_id;
  ELSE
    UPDATE levels
    SET "order" = "order" + 1
    WHERE "order" >= new_order
    AND "order" < old_order
    AND id != level_id;
  END IF;
END;
$$;