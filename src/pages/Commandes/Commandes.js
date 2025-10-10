import { useEffect, useState } from "react";
import { Get_Commandes, Get_wilayas } from "../../API/Sheets";
import "./Commandes.css";

/** --- Utils --- */
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
  return parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
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

/** --- Component --- */
export default function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const commandesPerPage = 8;

  useEffect(() => {
    async function loadData() {
      try {
        const data = await Get_Commandes();
        const cleanData = formaterCommandes(data);
        setCommandes(cleanData);
      } catch (err) {
        console.error("Erreur lors du fetch commandes:", err);
      }

      try {
        const wData = await Get_wilayas();
        setWilayas(wData);
      } catch (err) {
        console.error("Erreur lors du fetch wilayas:", err);
      }
    }
    loadData();
  }, []);

  const filteredWilayas = (code_wilaya) => {
    let nom = "";
    wilayas.forEach((w) => {
      if (w["code wilaya"] === code_wilaya) {
        nom = w["nom wilaya"];
      }
    });
    return nom;
  };

  // 🔍 Filtrer selon recherche
  const filteredCommandes = commandes.filter((cmd) =>
    Object.values(cmd).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 🔢 Pagination
  const indexOfLast = currentPage * commandesPerPage;
  const indexOfFirst = indexOfLast - commandesPerPage;
  const currentCommandes = filteredCommandes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCommandes.length / commandesPerPage);

  // 🎨 Couleurs selon l’état
  const getEtatClass = (etat) => {
    switch ((etat || "").toLowerCase().trim()) {
      case "nouvelle":
        return "etat-nouvelle"; // 🩵
      case "atelier":
        return "etat-atelier"; // 💜
      case "envoyer":
        return "etat-envoyer"; // 🟠
      case "livre":
      case "livré":
        return "etat-livre"; // 🟢
      case "annule":
      case "annulée":
        return "etat-annule"; // 🔴
      default:
        return "etat-inconnue"; // Gris
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>📦 Liste des Commandes</h1>
        <input
          type="text"
          placeholder="🔍 Rechercher une commande..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-bar"
        />
      </div>

      <div className="cards-grid">
        {currentCommandes.length > 0 ? (
          currentCommandes.map((cmd, i) => (
            <div className="order-card" key={i}>
              <div className="card-header">
                <span className="ref">📄 {cmd.reference || "N/A"}</span>
                <span className="date">{cmd.date || "—"}</span>
              </div>

              <div className="card-body">
                <h3>{cmd.nomClient || "Client inconnu"}</h3>
                <p>
                  📞 {cmd.telephone || "—"} <br />
                  🏙️ {filteredWilayas(cmd.codeWilaya)} - {cmd.commune} <br />
                  📍 {cmd.adresse || "—"}
                </p>
                <p>
                  📦 Produit : <b>{cmd.produit || "—"}</b>
                </p>
                <p>
                  💰 Montant : <b>{cmd.montant || "—"} DA</b>
                </p>
              </div>

              <div className="card-footer">
                <span className={`etat-badge ${getEtatClass(cmd.etat)}`}>
                  {cmd.etat || "—"}
                </span>
                <span className="badge">
                  {cmd.stopDesk ? "🛑 Stop Desk" : "🚚 Livraison"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-orders">❌ Aucune commande trouvée</p>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          ⬅️ Précédent
        </button>
        <span>
          Page {currentPage} / {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Suivant ➡️
        </button>
      </div>
    </div>
  );
}
