-- SQL Migration Script: Update Image URLs from sykeworld.com to uploads.sykeworld.com
-- Run this script on your PostgreSQL database to migrate all image URLs

-- ============================================
-- 1. Update Room Images
-- ============================================
UPDATE room_images
SET image = REPLACE(
    REPLACE(
        REPLACE(image, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE image LIKE '%sykeworld.com/uploads/%';

-- ============================================
-- 2. Update Gallery Images
-- ============================================
UPDATE gallery_images
SET image = REPLACE(
    REPLACE(
        REPLACE(image, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE image LIKE '%sykeworld.com/uploads/%';

-- ============================================
-- 3. Update User Profile Pictures
-- ============================================
UPDATE users
SET profile_picture = REPLACE(
    REPLACE(
        REPLACE(profile_picture, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE profile_picture LIKE '%sykeworld.com/uploads/%'
  AND profile_picture != 'default.jpg';

-- ============================================
-- 4. Update Menu Item Images
-- ============================================
UPDATE menu_items
SET image = REPLACE(
    REPLACE(
        REPLACE(image, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE image IS NOT NULL
  AND image LIKE '%sykeworld.com/uploads/%';

-- ============================================
-- 5. Update Drink Images
-- ============================================
UPDATE drinks
SET image = REPLACE(
    REPLACE(
        REPLACE(image, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE image IS NOT NULL
  AND image LIKE '%sykeworld.com/uploads/%';

-- ============================================
-- 6. Update Room Service Icons
-- ============================================
UPDATE room_services
SET icon = REPLACE(
    REPLACE(
        REPLACE(icon, 'https://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'),
        'http://sykeworld.com/uploads/', 'https://uploads.sykeworld.com/'
    ),
    'sykeworld.com/uploads/', 'uploads.sykeworld.com/'
)
WHERE icon IS NOT NULL
  AND icon LIKE '%sykeworld.com/uploads/%';

-- ============================================
-- Verification Queries (Run these to check results)
-- ============================================

-- Count updated records in each table
-- SELECT COUNT(*) as room_images_updated FROM room_images WHERE image LIKE '%uploads.sykeworld.com%';
-- SELECT COUNT(*) as gallery_images_updated FROM gallery_images WHERE image LIKE '%uploads.sykeworld.com%';
-- SELECT COUNT(*) as users_updated FROM users WHERE profile_picture LIKE '%uploads.sykeworld.com%';
-- SELECT COUNT(*) as menu_items_updated FROM menu_items WHERE image LIKE '%uploads.sykeworld.com%';
-- SELECT COUNT(*) as drinks_updated FROM drinks WHERE image LIKE '%uploads.sykeworld.com%';
-- SELECT COUNT(*) as room_services_updated FROM room_services WHERE icon LIKE '%uploads.sykeworld.com%';

-- Check if any old URLs remain
-- SELECT COUNT(*) as remaining_old_urls FROM room_images WHERE image LIKE '%sykeworld.com/uploads/%';
-- SELECT COUNT(*) as remaining_old_urls FROM gallery_images WHERE image LIKE '%sykeworld.com/uploads/%';
-- SELECT COUNT(*) as remaining_old_urls FROM users WHERE profile_picture LIKE '%sykeworld.com/uploads/%';
