/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `link` (text, required)
      - `image` (text, required)
      - `rating` (integer, default: 0)
      - `category` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for authenticated users to insert their own projects
    - Add policy for everyone to read all projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  link text NOT NULL,
  image text NOT NULL,
  rating integer DEFAULT 0,
  category text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read projects
CREATE POLICY "Projects are viewable by everyone" 
  ON projects 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own projects
CREATE POLICY "Users can create projects" 
  ON projects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);