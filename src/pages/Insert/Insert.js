import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import "./Insert.css";

import { getCurrentDateTime, findBestMatch, parseCommande } from "./Outils";

import {
  Add_Commandes,
  Get_Communes,
  Get_stations,
  Get_wilayas,
} from "../../API/Sheets";

export default function Insert() {
  const [mode, setMode] = useState("auto");
  const [message, setMessage] = useState("");

  const [manualData, setManualData] = useState({
    reference: "",
    name: "",
    tel1: "",
    tel2: "",
    produit: "",
    total: "",
    wilaya: "",
    commune: "",
    typedenvoi: "bureau",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [wilayas, setWilayas] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [stations, setStations] = useState([]);

  /* -------------------- LOAD WILAYAS & STATIONS -------------------- */
  useEffect(() => {
    async function loadData() {
      try {
        const [w, s] = await Promise.all([Get_wilayas(), Get_stations()]);
        setWilayas(w);
        setStations(s);
      } catch (err) {
        console.error("Erreur fetch:", err);
      }
    }
    loadData();
  }, []);

  /* -------------------- LOAD COMMUNES WHEN WILAYA CHANGES -------------------- */
  useEffect(() => {
    if (!manualData.wilaya || manualData.typedenvoi === "bureau") return;

    async function loadCommunes() {
      try {
        const result = await Get_Communes(manualData.wilaya);
        setCommunes(result);
      } catch (err) {
        console.error("Erreur fetch:", err);
      }
    }

    loadCommunes();
  }, [manualData.wilaya, manualData.typedenvoi]);

  /* -------------------- HANDLERS -------------------- */
  const handleManualChange = (e) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };

  const handleWilayaChange = (event, newValue) => {
    const code = newValue ? newValue["code wilaya"] : "";
    setManualData((prev) => ({
      ...prev,
      wilaya: code,
      commune: "",
    }));
    setCommunes([]);
  };

  /* -------------------- RESET FORMULAIRE -------------------- */
  const resetForm = () => {
    setManualData({
      reference: "",
      name: "",
      tel1: "",
      tel2: "",
      produit: "",
      total: "",
      wilaya: "",
      commune: "",
      typedenvoi: "bureau",
    });
    setMessage("");
    setStatus("");
    setCommunes([]);
  };

  /* -------------------- HANDLE MODE CHANGE AVEC RESET -------------------- */
  const handleModeChange = (newMode) => {
    resetForm(); // reset complet
    setMode(newMode);
  };

  /* -------------------- INSERT MANUEL -------------------- */
  const handleManualInsert = async () => {
    if (
      !manualData.name ||
      !manualData.tel1 ||
      !manualData.produit ||
      !manualData.total ||
      !manualData.commune
    ) {
      setStatus("⚠️ Tous les champs sont obligatoires.");
      return;
    }

    if (manualData.typedenvoi === "domicile" && !manualData.wilaya) {
      setStatus("⚠️ Wilaya obligatoire pour livraison à domicile.");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Envoi...");

      let communeName = manualData.commune;
      let stationCode = null;
      let adresse = manualData.commune;
      let wilayaCode = manualData.wilaya;

      /* ----------- MODE BUREAU ----------- */
      if (manualData.typedenvoi === "bureau") {
        const selectedStation = stations.find(
          (s) => s["Code de la station"] === manualData.commune
        );

        if (!selectedStation) throw new Error("Station non trouvée");

        communeName = selectedStation["Nom de la station"];
        stationCode = selectedStation["Code de la station"];
        adresse = selectedStation["Nom de la station"];
        wilayaCode = selectedStation["Code wilaya"];
      }

      /* ----------- ROW GOOGLE SHEETS ----------- */
      const row = [
        "Nouvelle",
        getCurrentDateTime(),
        manualData.reference,
        manualData.name,
        manualData.tel1,
        manualData.tel2,
        adresse,
        communeName,
        manualData.total,
        wilayaCode,
        manualData.produit,
        null,
        null,
        null,
        null,
        manualData.typedenvoi === "bureau" ? "OUI" : "",
        null,
        stationCode,
      ];

      const result = await Add_Commandes(row);
      setStatus(result.message || "✔️ Commande ajoutée !");

      // RESET AUTOMATIQUE APRÈS INSERT
      resetForm();
    } catch (err) {
      console.error(err);
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- INSERT AUTO -------------------- */
  const handleAutoInsert = async () => {
    if (!message.trim()) {
      setStatus("⚠️ Veuillez coller une commande !");
      return;
    }

    setLoading(true);
    setStatus("⏳ Analyse...");

    try {
      let extracted = parseCommande(message);

      if (!extracted) throw new Error("Commande non reconnue");

      const wilaya = findBestMatch(extracted.wilaya, wilayas, "nom wilaya");
      if (!wilaya) throw new Error("Wilaya non trouvée");

      extracted.wilaya = wilaya["code wilaya"];

      if (extracted.typedenvoi === "bureau") {
        const station = findBestMatch(
          extracted.commune,
          stations,
          "Nom de la station"
        );
        if (!station) throw new Error("Station non trouvée");

        extracted.commune = station["Nom de la station"];
        extracted.station = station["Code de la station"];
        extracted.adresse = station["Nom de la station"];
        extracted.typedenvoi = "OUI";
      } else {
        extracted.station = null;
        extracted.adresse = extracted.commune;
        extracted.typedenvoi = "";
      }

      const row = [
        "Nouvelle",
        getCurrentDateTime(),
        extracted.reference,
        extracted.name,
        extracted.tel1,
        extracted.tel2,
        extracted.adresse,
        extracted.commune,
        extracted.total,
        extracted.wilaya,
        extracted.produit,
        null,
        null,
        null,
        null,
        extracted.typedenvoi,
        null,
        extracted.station,
      ];

      const result = await Add_Commandes(row);
      setStatus(result.message || "✔️ Commande ajoutée !");
      resetForm();
    } catch (err) {
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="insert-container flex">
      <div className="mode-selector">
        <Button
          variant={mode === "auto" ? "contained" : "outlined"}
          onClick={() => handleModeChange("auto")}
        >
          Ajout automatique
        </Button>
        <Button
          variant={mode === "manuel" ? "contained" : "outlined"}
          onClick={() => handleModeChange("manuel")}
        >
          Ajout manuel
        </Button>
      </div>

      {/* AUTOMATIQUE */}
      {mode === "auto" && (
        <div className="auto-section flex">
          <h2>Ajout automatique</h2>

          <TextField
            label="Coller la commande ici..."
            multiline
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-large"
          />
          <div className="flex" style={{gap:'20px',justifyContent:'space-between',alignItems:'center'}}>
            <Button
              variant="contained"
              className="btn-full"
              onClick={handleAutoInsert}
              disabled={loading}
              style={{width:'50%'}}
            >
              {loading ? "⏳ Traitement..." : "Insérer"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={resetForm} 
              style={{width:'50%'}}
            >
              🔄 Réinitialiser
            </Button>
          </div>
        </div>
      )}

      {/* MANUEL */}
      {mode === "manuel" && (
        <div className="manual-section flex">
          <h2>Ajout manuel</h2>

          <div className="manual-grid">
            <TextField
              label="Référence"
              name="reference"
              style={{ width: "45%" }}
              value={manualData.reference}
              onChange={handleManualChange}
            />

            <TextField
              label="Nom complet"
              name="name"
              style={{ width: "45%" }}
              value={manualData.name}
              onChange={handleManualChange}
            />

            <TextField
              label="Téléphone 1"
              name="tel1"
              style={{ width: "45%" }}
              value={manualData.tel1}
              onChange={handleManualChange}
            />

            <TextField
              label="Téléphone 2"
              name="tel2"
              style={{ width: "45%" }}
              value={manualData.tel2}
              onChange={handleManualChange}
            />

            <TextField
              label="Produit"
              name="produit"
              style={{ width: "92%" }}
              value={manualData.produit}
              onChange={handleManualChange}
            />

            <TextField
              label="Prix Total"
              name="total"
              style={{ width: "45%" }}
              value={manualData.total}
              onChange={handleManualChange}
            />

            <TextField
              select
              label="Type d'envoi"
              name="typedenvoi"
              style={{ width: "45%" }}
              value={manualData.typedenvoi}
              onChange={handleManualChange}
            >
              <MenuItem value="bureau">bureau</MenuItem>
              <MenuItem value="domicile">domicile</MenuItem>
            </TextField>

            {/* MODE BUREAU */}
            {manualData.typedenvoi === "bureau" && (
              <Autocomplete
                options={stations}
                getOptionLabel={(station) =>
                  `${station["Nom de la station"]} - ${station["Code de la station"]}`
                }
                isOptionEqualToValue={(o, v) =>
                  o["Code de la station"] === v["Code de la station"]
                }
                onChange={(e, newValue) =>
                  setManualData({
                    ...manualData,
                    commune: newValue ? newValue["Code de la station"] : "",
                  })
                }
                value={
                  stations.find(
                    (s) => s["Code de la station"] === manualData.commune
                  ) || null
                }
                renderInput={(params) => (
                  <TextField {...params} label="Station (Bureau)" />
                )}
                style={{ width: "100%" }}
              />
            )}

            {/* MODE DOMICILE */}
            {manualData.typedenvoi === "domicile" && (
              <>
                <Autocomplete
                  options={wilayas}
                  getOptionLabel={(w) => w["nom wilaya"] || ""}
                  isOptionEqualToValue={(o, v) =>
                    o["code wilaya"] === v["code wilaya"]
                  }
                  value={
                    wilayas.find(
                      (w) => w["code wilaya"] === manualData.wilaya
                    ) || null
                  }
                  onChange={handleWilayaChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Wilaya" />
                  )}
                  style={{ width: "45%" }}
                />

                <Autocomplete
                  options={communes}
                  getOptionLabel={(c) => c["Nom de la commune"] || ""}
                  isOptionEqualToValue={(o, v) =>
                    o["Nom de la commune"] === v["Nom de la commune"]
                  }
                  value={
                    communes.find(
                      (c) => c["Nom de la commune"] === manualData.commune
                    ) || null
                  }
                  onChange={(e, newValue) =>
                    setManualData({
                      ...manualData,
                      commune: newValue ? newValue["Nom de la commune"] : "",
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Commune" />
                  )}
                  style={{ width: "45%" }}
                />
              </>
            )}
          </div>
          <div  className="flex" 
                style={{flexDirection:'column',gap:'20px',justifyContent:'space-between',alignItems:'center'}}
          >
            <Button
              variant="contained"
              className="btn-full"
              onClick={handleManualInsert}
              disabled={loading}
              style={{width:'100%'}}
            >
              {loading ? "⏳ Ajout..." : "Insérer"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={resetForm} 
              style={{width:'100%'}}
            >
              🔄 Réinitialiser
            </Button>
          </div>
        </div>
      )}

      {/* STATUS MESSAGE */}
      {status && <p className="status-message">{status}</p>}
    </div>
  );
}
