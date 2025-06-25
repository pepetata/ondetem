-- Add comments table to the database
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance when querying comments by ad_id
CREATE INDEX IF NOT EXISTS idx_comments_ad_id ON comments(ad_id);

-- Create index for better performance when querying comments by user_id
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE
    ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
