const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const FD_API_KEY  = process.env.FD_API_KEY;

// football-data.org team names → nos noms internes (sans drapeau)
const API_TEAMS = {
  'Mexico':'Mexique','South Africa':'Afrique du Sud','Korea Republic':'Corée du Sud','Czechia':'Tchéquie',
  'Canada':'Canada','Bosnia and Herzegovina':'Bosnie-Herzég.','Qatar':'Qatar','Switzerland':'Suisse',
  'Brazil':'Brésil','Morocco':'Maroc','Haiti':'Haïti','Scotland':'Écosse',
  'United States':'États-Unis','Paraguay':'Paraguay','Australia':'Australie','Turquie':'Turquie','Turkey':'Turquie',
  'Germany':'Allemagne','Curaçao':'Curaçao','Curacao':'Curaçao',
  "Côte d'Ivoire":"Côte d'Ivoire",'Ivory Coast':"Côte d'Ivoire",'Ecuador':'Équateur',
  'Netherlands':'Pays-Bas','Japan':'Japon','Sweden':'Suède','Tunisia':'Tunisie',
  'Belgium':'Belgique','Egypt':'Égypte','Iran':'Iran','New Zealand':'Nouvelle-Zél.',
  'Spain':'Espagne','Cabo Verde':'Cabo Verde','Cape Verde':'Cabo Verde','Saudi Arabia':'Arabie Saoud.','Uruguay':'Uruguay',
  'France':'France','Iraq':'Irak','Norway':'Norvège','Senegal':'Sénégal',
  'Argentina':'Argentine','Algeria':'Algérie','Austria':'Autriche','Jordan':'Jordanie',
  'Portugal':'Portugal','DR Congo':'RD Congo','Congo DR':'RD Congo','Colombia':'Colombie','Uzbekistan':'Ouzbékistan',
  'England':'Angleterre','Croatia':'Croatie','Ghana':'Ghana','Panama':'Panama',
};

// "NomDomicile|NomExtérieur" (noms internes) → match_id
const MATCH_ID = {
  'Mexique|Afrique du Sud':'a1','Corée du Sud|Tchéquie':'a2','Mexique|Corée du Sud':'a3',
  'Tchéquie|Afrique du Sud':'a4','Tchéquie|Mexique':'a5','Afrique du Sud|Corée du Sud':'a6',
  'Canada|Bosnie-Herzég.':'b1','Qatar|Suisse':'b2','Suisse|Bosnie-Herzég.':'b3',
  'Canada|Qatar':'b4','Suisse|Canada':'b5','Bosnie-Herzég.|Qatar':'b6',
  'Brésil|Maroc':'c1','Haïti|Écosse':'c2','Brésil|Haïti':'c3',
  'Maroc|Écosse':'c4','Maroc|Haïti':'c5','Écosse|Brésil':'c6',
  'États-Unis|Paraguay':'d1','Australie|Turquie':'d2','Turquie|Paraguay':'d3',
  'États-Unis|Australie':'d4','États-Unis|Turquie':'d5','Paraguay|Australie':'d6',
  'Allemagne|Curaçao':'e1',"Côte d'Ivoire|Équateur":'e2',"Allemagne|Côte d'Ivoire":'e3',
  'Équateur|Curaçao':'e4',"Curaçao|Côte d'Ivoire":'e5','Équateur|Allemagne':'e6',
  'Pays-Bas|Japon':'f1','Suède|Tunisie':'f2','Pays-Bas|Suède':'f3',
  'Japon|Tunisie':'f4','Tunisie|Pays-Bas':'f5','Japon|Suède':'f6',
  'Belgique|Égypte':'g1','Iran|Nouvelle-Zél.':'g2','Belgique|Iran':'g3',
  'Égypte|Nouvelle-Zél.':'g4','Nouvelle-Zél.|Belgique':'g5','Égypte|Iran':'g6',
  'Espagne|Cabo Verde':'h1','Arabie Saoud.|Uruguay':'h2','Espagne|Arabie Saoud.':'h3',
  'Uruguay|Cabo Verde':'h4','Uruguay|Espagne':'h5','Cabo Verde|Arabie Saoud.':'h6',
  'France|Sénégal':'i1','Irak|Norvège':'i2','France|Irak':'i3',
  'Norvège|Sénégal':'i4','Norvège|France':'i5','Sénégal|Irak':'i6',
  'Argentine|Algérie':'j1','Autriche|Jordanie':'j2','Argentine|Autriche':'j3',
  'Jordanie|Algérie':'j4','Jordanie|Argentine':'j5','Algérie|Autriche':'j6',
  'Portugal|RD Congo':'k1','Colombie|Ouzbékistan':'k2','Portugal|Ouzbékistan':'k3',
  'Colombie|RD Congo':'k4','Colombie|Portugal':'k5','Ouzbékistan|RD Congo':'k6',
  'Angleterre|Croatie':'l1','Ghana|Panama':'l2','Angleterre|Ghana':'l3',
  'Croatie|Panama':'l4','Panama|Angleterre':'l5','Croatie|Ghana':'l6',
};

function findMatchId(apiHome, apiAway) {
  const h = API_TEAMS[apiHome];
  const a = API_TEAMS[apiAway];
  if (!h || !a) return null;
  return MATCH_ID[`${h}|${a}`] || MATCH_ID[`${a}|${h}`] || null;
}

async function supabaseUpsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/results`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  return res.ok;
}

module.exports = async (req, res) => {
  try {
    // Récupère tous les matchs terminés du Mondial 2026
    const apiRes = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED', {
      headers: { 'X-Auth-Token': FD_API_KEY },
    });

    if (!apiRes.ok) {
      return res.status(502).json({ error: 'Erreur API football-data', status: apiRes.status });
    }

    const { matches } = await apiRes.json();
    if (!matches || matches.length === 0) {
      return res.status(200).json({ updated: 0, message: 'Aucun match terminé' });
    }

    const rows = [];
    const skipped = [];

    for (const m of matches) {
      const { home, away } = m.score.fullTime;
      if (home === null || away === null) continue;

      const matchId = findMatchId(m.homeTeam.name, m.awayTeam.name);
      if (!matchId) {
        skipped.push(`${m.homeTeam.name} vs ${m.awayTeam.name}`);
        continue;
      }

      rows.push({
        match_id: matchId,
        score_home: home,
        score_away: away,
        updated_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) await supabaseUpsert(rows);

    res.status(200).json({ updated: rows.length, skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
