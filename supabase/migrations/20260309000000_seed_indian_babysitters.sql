-- Fix: Update existing babysitter profiles that have a city but no location coordinates
-- AND insert seed babysitters with coordinates
-- Run in: https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor/sql

-- ============================================================
-- STEP 1: Update existing profiles that have city = 'chennai' (or similar)
-- ============================================================
UPDATE public.babysitter_profiles
SET location_lat = 13.0827, location_lng = 80.2707
WHERE lower(city) LIKE '%chennai%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 17.3850, location_lng = 78.4867
WHERE lower(city) LIKE '%hyderabad%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 19.0760, location_lng = 72.8777
WHERE lower(city) LIKE '%mumbai%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 28.6139, location_lng = 77.2090
WHERE lower(city) LIKE '%delhi%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 12.9716, location_lng = 77.5946
WHERE (lower(city) LIKE '%bangalore%' OR lower(city) LIKE '%bengaluru%') AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 22.5726, location_lng = 88.3639
WHERE lower(city) LIKE '%kolkata%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 18.5204, location_lng = 73.8567
WHERE lower(city) LIKE '%pune%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 26.9124, location_lng = 75.7873
WHERE lower(city) LIKE '%jaipur%' AND (location_lat IS NULL OR location_lng IS NULL);

UPDATE public.babysitter_profiles
SET location_lat = 1.3521, location_lng = 103.8198
WHERE lower(city) LIKE '%singapore%' AND (location_lat IS NULL OR location_lng IS NULL);

-- Catch-all: profiles with city = 'India' but no specific city
UPDATE public.babysitter_profiles
SET location_lat = 28.6139, location_lng = 77.2090
WHERE lower(city) LIKE '%india%' AND (location_lat IS NULL OR location_lng IS NULL);

-- ============================================================
-- STEP 2: Any remaining profiles with NO coordinates at all
--         Give them a slight offset from Delhi so they show up
-- ============================================================
UPDATE public.babysitter_profiles
SET location_lat = 28.6139 + (random() * 0.1 - 0.05),
    location_lng = 77.2090 + (random() * 0.1 - 0.05)
WHERE location_lat IS NULL OR location_lng IS NULL;

-- ============================================================
-- STEP 3: Insert seed babysitters (safe to re-run)
-- ============================================================
INSERT INTO public.babysitter_profiles (
  user_id, name, bio, city, location_lat, location_lng,
  hourly_rate, max_kids, is_verified, rating_avg, rating_count,
  years_experience, languages, skills
) VALUES
('00000000-0001-4000-a000-000000000001',
 'Priya Sharma', 'Experienced and caring babysitter with 5 years of experience. CPR certified and first aid trained.',
 'New Delhi', 28.6139, 77.2090, 350, 3, true, 4.8, 12, 5,
 ARRAY['Hindi','English'], ARRAY['First Aid','CPR','Early Education']),
('00000000-0002-4000-a000-000000000002',
 'Ananya Gupta', 'Passionate about childcare with a background in child psychology.',
 'Gurugram', 28.4595, 77.0266, 400, 2, true, 4.9, 18, 7,
 ARRAY['Hindi','English','Punjabi'], ARRAY['Child Psychology','Cooking','Arts & Crafts']),
('00000000-0003-4000-a000-000000000003',
 'Riya Patel', 'College student studying education. Available evenings and weekends.',
 'Noida', 28.5355, 77.3910, 250, 2, false, 4.5, 6, 2,
 ARRAY['Hindi','English'], ARRAY['Homework Help','Storytelling']),
('00000000-0004-4000-a000-000000000004',
 'Meera Singh', 'Full-time nanny with 10+ years experience in newborn and infant care.',
 'Dwarka, Delhi', 28.5921, 77.0460, 500, 4, true, 4.7, 24, 10,
 ARRAY['Hindi','English','Marathi'], ARRAY['Newborn Care','Night Watch','Cooking','First Aid']),
('00000000-0005-4000-a000-000000000005',
 'Sneha Desai', 'Fun and energetic babysitter! I organize creative activities and outdoor games.',
 'Mumbai', 19.0760, 72.8777, 450, 3, true, 4.6, 15, 4,
 ARRAY['Hindi','English','Gujarati','Marathi'], ARRAY['Arts & Crafts','Music','Outdoor Activities']),
('00000000-0006-4000-a000-000000000006',
 'Kavita Joshi', 'Retired school teacher offering babysitting services.',
 'Thane', 19.2183, 72.9781, 300, 3, true, 4.9, 30, 15,
 ARRAY['Hindi','English','Marathi'], ARRAY['Teaching','Homework Help','First Aid','Storytelling']),
('00000000-0007-4000-a000-000000000007',
 'Divya Reddy', 'Software engineer turned full-time mom. Experienced with kids aged 1-8.',
 'Bangalore', 12.9716, 77.5946, 380, 2, true, 4.4, 8, 3,
 ARRAY['English','Hindi','Telugu','Kannada'], ARRAY['STEM Activities','Coding for Kids','Cooking']),
('00000000-0008-4000-a000-000000000008',
 'Lakshmi Iyer', 'Traditional values with modern approach. Available full-time.',
 'Chennai', 13.0827, 80.2707, 280, 4, false, 4.3, 5, 6,
 ARRAY['Tamil','English','Hindi'], ARRAY['Cooking','Storytelling','Music']),
('00000000-0009-4000-a000-000000000009',
 'Sanjana Roy', 'Professional babysitter and trained Montessori teacher.',
 'Kolkata', 22.5726, 88.3639, 320, 3, true, 4.7, 20, 8,
 ARRAY['Bengali','Hindi','English'], ARRAY['Montessori','Arts & Crafts','Dance','First Aid']),
('00000000-0010-4000-a000-000000000010',
 'Nisha Agarwal', 'Loving and responsible babysitter. Weekend and holiday availability.',
 'Jaipur', 26.9124, 75.7873, 220, 2, false, 4.2, 4, 1,
 ARRAY['Hindi','English','Rajasthani'], ARRAY['Drawing','Storytelling','Outdoor Games']),
('00000000-0011-4000-a000-000000000011',
 'Fatima Khan', 'Experienced caregiver with nursing background. Special needs specialist.',
 'Hyderabad', 17.3850, 78.4867, 420, 2, true, 4.8, 16, 9,
 ARRAY['Hindi','English','Urdu','Telugu'], ARRAY['Special Needs','First Aid','CPR','Medical Care']),
('00000000-0012-4000-a000-000000000012',
 'Aditi Kulkarni', 'Young, energetic, and creative! Also available for overnight babysitting.',
 'Pune', 18.5204, 73.8567, 300, 3, false, 4.5, 9, 3,
 ARRAY['Marathi','Hindi','English'], ARRAY['Outdoor Activities','Cooking','Arts & Crafts','Swimming'])
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name, bio = EXCLUDED.bio, city = EXCLUDED.city,
  location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng,
  hourly_rate = EXCLUDED.hourly_rate, max_kids = EXCLUDED.max_kids,
  is_verified = EXCLUDED.is_verified, rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count, years_experience = EXCLUDED.years_experience,
  languages = EXCLUDED.languages, skills = EXCLUDED.skills, updated_at = now();
