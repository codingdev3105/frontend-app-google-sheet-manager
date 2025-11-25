import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { Get_Commandes, Get_wilayas } from "../../API/Sheets";
import "./Statistic.css";

// ----------------- Helpers -----------------
function normalizeHeader(header) {
  if (!header) return "";
  let s = header.replace(/↵|\r|\n/g, " ");
  s = s.replace(/\(.*?\)/g, " ");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^a-zA-Z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  return s;
}
function toCamelCase(str) {
  const parts = str.split(" ");
  return parts.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join("");
}
const ALIASES = {
  "code de station": "codeStation",
  date: "date",
  echange: "echange",
  "ouvrir le colis": "ouvrirColis",
  "pick up": "pickup",
  "stop desk": "stopDesk",
  "adresse de livraison": "adresse",
  "code wilaya": "codeWilaya",
  "commune de livraison": "commune",
  "deuxieme numero": "deuxiemeNumero",
  "montant total du colis": "montant",
  "nom et prenom du client": "nomClient",
  "poids en kg": "poids",
  produit: "produit",
  reference: "reference",
  remarque: "remarque",
  telephone: "telephone",
  etat: "etat",
};
function formaterCommandes(commandes) {
  return commandes.map((cmd) => {
    const cleanObj = {};
    Object.keys(cmd).forEach((origKey) => {
      const norm = normalizeHeader(origKey);
      const finalKey = ALIASES[norm] || toCamelCase(norm);
      cleanObj[finalKey] = cmd[origKey] || "";
    });
    return cleanObj;
  });
}
function parseMontant(m) {
  if (!m && m !== 0) return 0;
  const n = String(m).replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  return Number(n) || 0;
}
function parseDateFromString(s) {
  if (!s) return null;
  const parts = s.split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "00:00";
  const [d, m, y] = (datePart || "").split("-");
  if (!d || !m || !y) return new Date(s);
  const [hh, mm] = timePart.split(":");
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh || 0), Number(mm || 0));
}

const COLORS = ["#90caf9", "#ce93d8", "#ffb74d", "#66bb6a", "#ef5350", "#4E9FEE"];

export default function Statistics() {
  const [rawCommandes, setRawCommandes] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await Get_Commandes();
        const clean = formaterCommandes(data || []);
        const enriched = clean.map((c, i) => ({
          _id: i + 1,
          ...c,
          montantNum: parseMontant(c.montant),
          dateObj: parseDateFromString(c.date || ""),
        }));
        setRawCommandes(enriched);
        const w = await Get_wilayas();
        setWilayas(w || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const nouvelles = useMemo(() => rawCommandes.filter(c => ((c.etat||"").toLowerCase() === "nouvelle")), [rawCommandes]);

  const filtered = useMemo(() => {
    let list = rawCommandes.slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => [c.nomClient, c.produit, c.reference, c.adresse, c.telephone].join(" ").toLowerCase().includes(q));
    }
    if (dateFrom) {
      const df = new Date(dateFrom);
      list = list.filter(c => c.dateObj && c.dateObj >= df);
    }
    if (dateTo) {
      const dt = new Date(dateTo);
      dt.setHours(23,59,59,999);
      list = list.filter(c => c.dateObj && c.dateObj <= dt);
    }
    return list;
  }, [rawCommandes, query, dateFrom, dateTo]);

  const totalCommandes = filtered.length;

  const byWilaya = useMemo(() => {
    const m = {};
    filtered.forEach(c => {
      const code = c.codeWilaya || c.code || "Inconnu";
      const label = String(code);
      m[label] = (m[label] || 0) + 1;
    });
    return Object.keys(m).map(k => ({ name: k, value: m[k] }));
  }, [filtered]);

  const byDate = useMemo(() => {
    const m = {};
    filtered.forEach(c => {
      if (!c.dateObj) return;
      const key = c.dateObj.toISOString().slice(0,10);
      m[key] = (m[key] || 0) + 1;
    });
    return Object.keys(m).sort().map(k => ({ date: k, commandes: m[k] }));
  }, [filtered]);

  const byEtat = useMemo(() => {
    const m = {};
    filtered.forEach(c => {
      const e = (c.etat || "Inconnu").trim();
      m[e] = (m[e] || 0) + 1;
    });
    return Object.keys(m).map((k,i) => ({ name: k, value: m[k], fill: COLORS[i % COLORS.length] }));
  }, [filtered]);

  function exportNouvellesCSV() {
    if (!nouvelles.length) return alert('Aucune commande nouvelle');
    const headers = Object.keys(nouvelles[0]);
    const rows = nouvelles.map(r => headers.map(h => `"${String(r[h]||"").replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nouvelles_commandes_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div className="orders-container">
      <div className="spinner-multi" aria-hidden="true"></div>
    </div>
  );

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>Statistiques — Y Store35</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input className="search-bar" placeholder="Rechercher... (client/produit)" value={query} onChange={e => setQuery(e.target.value)} />
          <input type="date" className="search-bar" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input type="date" className="search-bar" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="cards-grid" style={{ marginBottom: 20 }}>
        <div className="order-card">
          <div className="card-header"><span>Total commandes</span><span className="badge">au total</span></div>
          <div className="card-body"><h3>{totalCommandes}</h3><p>Nombre de commandes correspondant aux filtres actuels</p></div>
          <div className="card-footer"><button className="badge" onClick={exportNouvellesCSV}>Exporter nouvelles</button></div>
        </div>
      </div>

      <div className="chart-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h4>Nombre de commandes par état</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byEtat}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">
                {byEtat.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h4>Commandes par wilaya</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byWilaya}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Évolution quotidienne</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="commandes" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>


      </div>

      <h3 style={{ marginBottom: 12 }}>Commandes — état: Nouvelle</h3>
      <div className="cards-grid">
        {nouvelles.length === 0 && <div className="no-orders">Aucune commande nouvelle</div>}
        {nouvelles.map((o) => (
          <div className="order-card" key={o._id}>
            <div className="card-header">
              <div>{o.nomClient || '—'}</div>
              <div className={`etat-badge etat-nouvelle`}>Nouvelle</div>
            </div>
            <div className="card-body">
              <h3>{o.produit || 'Produit inconnu'}</h3>
              <p>Réf: {o.reference || '-'}</p>
              <p>Montant: {o.montantNum ? o.montantNum.toLocaleString() + ' DA' : '-'}</p>
              <p>Wilaya: { (wilayas.find(w => String(w['code wilaya']) === String(o.codeWilaya)) || {}).nom || o.codeWilaya || '-' }</p>
            </div>
            <div className="card-footer">
              <button className="badge" onClick={() => navigator.clipboard.writeText(JSON.stringify(o))}>Copier</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        {/* Placeholder if you want pagination later */}
      </div>

    </div>
  );
}

