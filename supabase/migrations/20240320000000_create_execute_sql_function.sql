-- Create a function to safely execute SQL queries
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Check if the query is safe (only SELECT statements)
    IF NOT (query ILIKE 'SELECT%') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;

    -- Check for dangerous operations
    IF (
        query ILIKE '%DROP%' OR
        query ILIKE '%DELETE%' OR
        query ILIKE '%UPDATE%' OR
        query ILIKE '%INSERT%' OR
        query ILIKE '%TRUNCATE%' OR
        query ILIKE '%ALTER%' OR
        query ILIKE '%CREATE%'
    ) THEN
        RAISE EXCEPTION 'Query contains forbidden operations';
    END IF;

    -- Execute the query and return results as JSON
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    
    -- Return empty array if no results
    RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error executing query: %', SQLERRM;
END;
$$; 