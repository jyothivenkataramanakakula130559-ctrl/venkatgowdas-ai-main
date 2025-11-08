-- Add backend support columns to website_generations table
ALTER TABLE public.website_generations
ADD COLUMN has_backend boolean NOT NULL DEFAULT false,
ADD COLUMN backend_code text,
ADD COLUMN database_schema text,
ADD COLUMN edge_functions jsonb;