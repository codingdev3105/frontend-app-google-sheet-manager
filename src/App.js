import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home/Home";  
import Commandes from "./pages/Commandes/Commandes";
import Insert from "./pages/Insert/Insert";
import Statistics from "./pages/Statistic/Statistic";
import "./App.css"

function App() {

  return (
    <Router>
      {/* Navbar */}
      <nav className="nav flex">
        <div className="nav-logo flex">
          <img src="/images/sheet-icon.png" alt="logo" width={40}/>
          <h3><Link to="/" className="nav-option-acceuil">Gestion de Commerce</Link></h3>
        </div>
        <div className="nav-options flex">
          <Link to="/" className="nav-option">Accueil</Link>
          <Link to="/inserer" className="nav-option">Insérer</Link>
          <Link to="/commandes" className="nav-option">Commandes</Link>
          <Link to="/statistiques" className="nav-option">Statistiques</Link>
        </div>
        <img src="/images/instagram.png" alt="instagram" width={40}/>
      </nav>

      {/* Contenu */}
      <div className="pages">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inserer" element={<Insert />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/statistiques" element={<Statistics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
