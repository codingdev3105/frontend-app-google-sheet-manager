import { useEffect, useState } from "react";
import { Get_Commandes , Get_wilayas } from "../../API/Sheets";
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
    async function laodCommandes() {
      try {
        const data = await Get_Commandes(); 
        const cleanData = formaterCommandes(data);
        setCommandes(cleanData);
      } catch (err) {
        console.error("Erreur lors du fetch:", err);
      }
    }
    laodCommandes();

    async function loadWilayas() {
      try {
        const data = await Get_wilayas(); 
        setWilayas(data); 
      } catch (err) {
        console.error("Erreur lors du fetch:", err);
      }
    }
    loadWilayas();
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


  // ✅ Filtrer les commandes selon la recherche
  const filteredCommandes = commandes.filter((cmd) =>
    Object.values(cmd).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ✅ Pagination
  const indexOfLast = currentPage * commandesPerPage;
  const indexOfFirst = indexOfLast - commandesPerPage;
  const currentCommandes = filteredCommandes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCommandes.length / commandesPerPage);

  return (
    <div className="orders-container">

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>📦 Liste des commandes</h1>

        {/* 🔍 Barre de recherche */}
        <input
          type="text"
          placeholder="Rechercher une commande..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset pagination à la première page
          }}
          className="search-bar"
        />

      </div>
      
      <table className="orders-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Réf</th>
            <th>Nom Client</th>
            <th>Téléphone</th>
            <th>Wilaya</th>
            <th>Commune</th>
            <th>Adresse</th>
            <th>Stop Desk</th>
            <th>Produit</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {currentCommandes.length > 0 ? (
            currentCommandes.map((cmd, i) => (
              <tr key={i}>
                <td>{cmd.date}</td>
                <td>{cmd.reference}</td>
                <td>{cmd.nomClient}</td>
                <td>{cmd.telephone}</td>
                <td>{filteredWilayas(cmd.codeWilaya)}</td>
                <td>{cmd.commune}</td>
                <td>{cmd.adresse}</td>
                <td>{cmd.stopDesk}</td>
                <td>{cmd.produit}</td>
                <td>{cmd.montant}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "10px" }}>
                ❌ Aucune commande trouvée
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* --- Pagination Controls --- */}
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
