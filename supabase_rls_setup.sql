-- RLS'yi etkinleştir (Zaten etkinse sorun çıkarmaz)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_commenters ENABLE ROW LEVEL SECURITY; -- Rozet sistemi için

-- Mevcut tüm politikaları sil (Hata vermesi durumunda yoksayılır)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "blog_posts_select_all" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_auth" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_own" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete_own" ON blog_posts;
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
DROP POLICY IF EXISTS "post_votes_select_all" ON post_votes;
DROP POLICY IF EXISTS "post_votes_upsert_own" ON post_votes;
DROP POLICY IF EXISTS "post_votes_delete_own" ON post_votes;
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "first_commenters_select_all" ON first_commenters;
DROP POLICY IF EXISTS "first_commenters_insert_auth" ON first_commenters;

-- =================================================================
-- 1. PROFILES TABLOSU
-- =================================================================

-- Kendi profilini okuyabilir (SELECT)
CREATE POLICY profiles_select_own ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Kendi profilini güncelleyebilir (UPDATE)
CREATE POLICY profiles_update_own ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- =================================================================
-- 2. BLOG_POSTS TABLOSU
-- =================================================================

-- Herkes okuyabilir (SELECT)
CREATE POLICY blog_posts_select_all ON blog_posts
FOR SELECT
USING (true);

-- Giriş yapan kullanıcı post ekleyebilir (INSERT)
CREATE POLICY blog_posts_insert_auth ON blog_posts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Kendi postunu güncelleyebilir (UPDATE)
CREATE POLICY blog_posts_update_own ON blog_posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Kendi postunu silebilir (DELETE)
CREATE POLICY blog_posts_delete_own ON blog_posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =================================================================
-- 3. COMMENTS TABLOSU
-- =================================================================

-- Herkes okuyabilir (SELECT)
CREATE POLICY comments_select_all ON comments
FOR SELECT
USING (true);

-- Giriş yapan kullanıcı yorum ekleyebilir (INSERT)
CREATE POLICY comments_insert_auth ON comments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Kendi yorumunu silebilir (DELETE)
CREATE POLICY comments_delete_own ON comments
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =================================================================
-- 4. POST_VOTES TABLOSU
-- =================================================================

-- Herkes oy sayısını görebilir (SELECT)
CREATE POLICY post_votes_select_all ON post_votes
FOR SELECT
USING (true);

-- Giriş yapan kullanıcı oy verebilir/değiştirebilir/silebilir (INSERT, UPDATE, DELETE)
-- Bu işlemlerin hepsi sunucu tarafından tek bir API rotası üzerinden yönetildiği için,
-- sadece kullanıcının kendi oyu üzerinde işlem yapmasına izin veriyoruz.
CREATE POLICY post_votes_upsert_own ON post_votes
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 5. ANNOUNCEMENTS TABLOSU (Duyurular)
-- =================================================================

-- Herkes okuyabilir (SELECT)
CREATE POLICY announcements_select_all ON announcements
FOR SELECT
USING (true);

-- INSERT, UPDATE, DELETE işlemleri sadece Service Role (Sunucu) tarafından yapılmalıdır.
-- Bu nedenle, bu işlemler için RLS politikası oluşturmuyoruz (veya sadece service_role'e izin veriyoruz).
-- Supabase'de varsayılan olarak RLS etkinleştirildiğinde, izin verilmeyen roller için erişim engellenir.

-- =================================================================
-- 6. FIRST_COMMENTERS TABLOSU (Rozet Sistemi)
-- =================================================================

-- Herkes okuyabilir (SELECT)
CREATE POLICY first_commenters_select_all ON first_commenters
FOR SELECT
USING (true);

-- Giriş yapan kullanıcı kayıt ekleyebilir (INSERT)
CREATE POLICY first_commenters_insert_auth ON first_commenters
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE ve UPDATE işlemleri sadece Service Role (Sunucu) tarafından yapılmalıdır.