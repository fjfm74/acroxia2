UPDATE site_config
SET value = jsonb_set(value, '{accepted_formats}', '["PDF","DOCX","JPG","PNG","WEBP"]'::jsonb),
    updated_at = NOW()
WHERE key = 'company_info';