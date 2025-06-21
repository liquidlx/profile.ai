-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a database for the application
-- (This is already created by the POSTGRES_DB environment variable, but we can add additional setup here)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE profile_ai TO postgres;

-- Set timezone
SET timezone = 'UTC';

-- Log the initialization
SELECT 'Vector extension enabled and database initialized successfully' as status; 