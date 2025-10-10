import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import RadioGroupe from "../../components/RadioGroup";
import "./Insert.css";
import {
  parseCommande,
  findBestMatch,
  getCurrentDateTime,
} from "./Outils";
import {
  Add_Commandes,
  Get_Communes,
  Get_stations,
  Get_wilayas,
} from "../../API/Sheets";

export default function Insert() {
  const [mode, setMode] = useState("auto");
  const [message, setMessage] = useState("");
  const [wilayas, setWilayas] = useState([]);
  const [stations, setStations] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger wilayas, stations et communes
    async function loadData() {
      try {
        const [w, s, c] = await Promise.all([
          Get_wilayas(),
          Get_stations(),
          Get_Communes(),
        ]);
        setWilayas(w);
        setStations(s);
        setCommunes(c);
      } catch (err) {
        console.error("Erreur lors du fetch:", err);
      }
    }
    loadData();
  }, []);

  const Insert_in_googl_sheets = async (commande_extracted) => {
    if (!commande_extracted) {
      setStatus("⚠️ Commande incomplète !");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Analyse en cours...");

      // Correspondance wilaya
      const wilaya = findBestMatch(
        commande_extracted.wilaya,
        wilayas,
        "nom wilaya"
      );
      if (!wilaya) {
        setStatus("❌ Wilaya non trouvée");
        setLoading(false);
        return;
      }
      commande_extracted.wilaya = wilaya["code wilaya"];

      if (commande_extracted.typedenvoi === "bureau") {
        commande_extracted.typedenvoi = "OUI";
        const station = findBestMatch(
          commande_extracted.commune,
          stations,
          "Nom de la station"
        );
        if (!station) {
          setStatus("❌ Station non trouvée");
          setLoading(false);
          return;
        }
        commande_extracted.commune = station["Nom de la station"];
        commande_extracted.station = station["Code de la station"];
        commande_extracted.adresse = station["Nom de la station"];
      } else {
        commande_extracted.typedenvoi = "";
        const commune = findBestMatch(
          commande_extracted.commune,
          communes,
          "Nom de la commune"
        );
        if (!commune) {
          setStatus("❌ Commune non trouvée");
          setLoading(false);
          return;
        }
        commande_extracted.commune = commune["Nom de la commune"];
        commande_extracted.adresse = commune["Nom de la commune"];
        commande_extracted.station = null;
      }

      console.log("✅ commande finale :", commande_extracted);

      const commande = [
        'Nouvelle',
        getCurrentDateTime(),
        commande_extracted.reference,
        commande_extracted.name,
        commande_extracted.tel1,
        commande_extracted.tel2,
        commande_extracted.adresse,
        commande_extracted.commune,
        commande_extracted.total,
        commande_extracted.wilaya,
        commande_extracted.produit,
        null,
        null,
        null,
        null,
        commande_extracted.typedenvoi,
        null,
        commande_extracted.station,
      ];

      const result = await Add_Commandes(commande);
      setStatus(`${result.message}`);
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus(`❌ Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    if (!message.trim()) {
      setStatus("⚠️ Veuillez insérer une commande !");
      return;
    }

    const commande_extracted = parseCommande(message);
    await Insert_in_googl_sheets(commande_extracted);
  };

  const handleReset = () => {
    setMessage("");
    setStatus("");
    setLoading(false);
  };

  return (
    <div className="inserer">
      {/* Desktop */}
      <div className="inser-semi-page">
        <h2>Ajout automatique</h2>
        <TextField
          id="outlined-multiline-static"
          label="Insérer la commande ici..."
          multiline
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "300px" }}
        />
        <div style={{ display: "flex",flexDirection:'column', gap: "10px", marginTop: "10px" }}>
          <Button
            variant="contained"
            style={{ width: "300px" }}
            onClick={handleInsert}
            disabled={loading}
          >
            {loading ? "⏳ Analyse en cours..." : "Analyser"}
          </Button>
          <Button
            variant="outlined"
            style={{ width: "300px" }}
            onClick={handleReset}
          >
            🔄 Réinitialiser
          </Button>
        </div>
        {status && (
          <p style={{ marginTop: "10px", color: status.startsWith("✅") ? "green" : "red" }}>
            {status}
          </p>
        )}
      </div>

      <div className="inser-semi-page">
        <h2>Ajout manuel</h2>
        <p style={{ textAlign: "center", width: "300px", color: "#555" }}>
          (Bientôt disponible — section manuelle à compléter)
        </p>
      </div>

      {/* Mobile */}
      <div className="inserer-mobile">
        <RadioGroupe
          list={["Ajout automatique", "Ajout manuel"]}
          onChange={(val) =>
            setMode(val === "Ajout automatique" ? "auto" : "manuel")
          }
          title="Choisir comment ajouter une commande "
        />
        {
          mode === "auto" ?  
          <>
              <h3>Ajout automatique </h3>
              <TextField
                id="mobile-insert"
                label="Collez la commande ici..."
                multiline
                rows={10}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: "280px" }}
              />
              <div style={{ display: "flex",flexDirection:'column', gap: "10px", marginTop: "10px" }}>
                <Button
                  variant="contained"
                  style={{ width: "280px" }}
                  onClick={handleInsert}
                  disabled={loading}
                >
                  {loading ? "⏳ Analyse en cours..." : "Analyser"}
                </Button>
                <Button
                  variant="outlined"
                  style={{ width: "280px" }}
                  onClick={handleReset}
                >
                  🔄 Réinitialiser
                </Button>
              </div>
              {status && (
                <p style={{ marginTop: "10px", color: status.startsWith("✅") ? "green" : "red" }}>
                  {status}
                </p>
              )}
          
          </>
          
          :  
              <>
                  <h3>Ajout manuel</h3>
                  <p style={{ textAlign: "center", width: "300px", color: "#555" }}>
                    (Bientôt disponible — section manuelle à compléter)
                  </p>
              
              </>
        }

      </div>
    </div>
  );
}
