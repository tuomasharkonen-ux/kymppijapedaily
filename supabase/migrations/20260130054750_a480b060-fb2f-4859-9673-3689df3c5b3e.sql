-- Change active_action from text to text[] to support multiple active actions
ALTER TABLE user_settings 
ALTER COLUMN active_action TYPE text[] 
USING CASE 
  WHEN active_action IS NULL THEN NULL 
  ELSE ARRAY[active_action] 
END;