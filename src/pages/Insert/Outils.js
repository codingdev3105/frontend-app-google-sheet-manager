// === FONCTIONS UTILITAIRES ===

// découper le message brut
export function splitMessage(message) {
    return message
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
}

// extraire un nombre dans une ligne
export function extractNumber(line) {
    const match = line.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

// === Fonction principale pour parser la commande ===
export function parseCommande(message) {
    const lignes = splitMessage(message);

    let commande = {
        name: "",
        tel1: "",
        tel2: "",
        wilaya: "",
        commune: "",
        typedenvoi: "",
        adresse: "",
        produit: "",
        prix: 0,
        livraison: 0,
        total: 0,
        reference: "",
    };

    const produits = [];

    lignes.forEach((line, idx) => {

        // 1️⃣ nom
        if (idx === 0) commande.name = line;

        // 2️⃣ téléphone
        else if (idx === 1) {
        const phones = line.match(/(?:\+213|0)\d{9}/g);
        if (phones) {
            const nums = phones.map(p =>
            parseInt(p.replace("+213", "0")) // normalisation vers 0XXXXXXXXX
            );
            commande.tel1 = nums[0] || null;
            commande.tel2 = nums[1] || null;
        }
        }

        // 3️⃣ wilaya
        else if (idx === 2) commande.wilaya = line;
        
        // 4️⃣ commune
        else if (idx === 3) commande.commune = line;

        // 5️⃣ type d’envoi
        else if (idx === 4) {
            if (line.toLowerCase().includes("bureau"))
                commande.typedenvoi = "bureau";
            else if (line.toLowerCase().includes("domicile"))
                commande.typedenvoi = "domicile";
        }

        // 6️⃣ produits
        else if (!/prix|livr|total|^r\d+/i.test(line) && idx >= 5 && line.trim()) {
            produits.push(line);
        }

        // 7️⃣ prix
        else if (/prix/i.test(line)) commande.prix = extractNumber(line);

        // 8️⃣ livraison
        else if (/livr/i.test(line)) commande.livraison = extractNumber(line);

        // 9️⃣ total
        else if (/total/i.test(line)) commande.total = extractNumber(line);

        // 🔟 référence
        else if (/^r\d+/i.test(line))
            commande.reference = line.replace(/[^\d]/g, "");
    });

    commande.produit = produits.join(" + ");
    commande.adresse = commande.commune;

    if (
        !commande.name ||
        !commande.tel1 ||
        !commande.wilaya ||
        !commande.commune ||
        !commande.produit ||
        commande.total === 0 ||
        commande.reference == ''
    ) {
        return null
    }
    else return commande;
}

export function findBestMatch(inputText, listItems, key = null) {
  if (!inputText || !Array.isArray(listItems) || listItems.length === 0) return null;

  // Normalisation du texte
  const normalize = (text) =>
    text.toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");

  const inputNorm = normalize(inputText);

  // --- Fonction de similarité (distance de Levenshtein)
  function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // suppression
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }

  // --- Calcul du meilleur score de similarité ---
  let bestItem = null;
  let bestScore = 0;

  for (const item of listItems) {
    const value = key ? item[key] : item;
    if (!value) continue;

    const norm = normalize(String(value));
    const distance = levenshtein(inputNorm, norm);
    const maxLen = Math.max(inputNorm.length, norm.length);
    const score = ((maxLen - distance) / maxLen) * 100; // % de similarité

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  // Retourne si la similarité est raisonnable (>=70%)
  return bestScore >= 70 ? bestItem : null;
}


export function getCurrentDateTime() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

