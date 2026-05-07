CREATE TABLE codes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, code TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE participants (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, code TEXT UNIQUE NOT NULL REFERENCES codes(code) ON DELETE CASCADE, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE pronostics (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, participant_code TEXT NOT NULL REFERENCES participants(code) ON DELETE CASCADE, match_id TEXT NOT NULL, score_home INT NOT NULL, score_away INT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(participant_code, match_id));
CREATE TABLE results (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, match_id TEXT UNIQUE NOT NULL, score_home INT NOT NULL, score_away INT NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE admin_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);

ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "codes_select" ON codes FOR SELECT USING (true);
CREATE POLICY "codes_insert" ON codes FOR INSERT WITH CHECK (true);
CREATE POLICY "codes_delete" ON codes FOR DELETE USING (true);
CREATE POLICY "participants_select" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "pronostics_select" ON pronostics FOR SELECT USING (true);
CREATE POLICY "pronostics_insert" ON pronostics FOR INSERT WITH CHECK (true);
CREATE POLICY "pronostics_update" ON pronostics FOR UPDATE USING (true);
CREATE POLICY "results_select" ON results FOR SELECT USING (true);
CREATE POLICY "results_insert" ON results FOR INSERT WITH CHECK (true);
CREATE POLICY "results_update" ON results FOR UPDATE USING (true);
CREATE POLICY "results_delete" ON results FOR DELETE USING (true);
CREATE POLICY "config_select" ON admin_config FOR SELECT USING (true);
CREATE POLICY "config_insert" ON admin_config FOR INSERT WITH CHECK (true);
CREATE POLICY "config_update" ON admin_config FOR UPDATE USING (true);

INSERT INTO codes (code) VALUES ('GRAV-0001'),('GRAV-0002'),('GRAV-0003'),('GRAV-0004'),('GRAV-0005');
INSERT INTO admin_config (key, value) VALUES ('admin_pwd','Gravetincelle2026'),('nb_lots','5');
