import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home/Home";  
import Commandes from "./pages/Commandes/Commandes";
import Insert from "./pages/Insert/Insert";
import Statistics from "./pages/Statistic/Statistic";
import { AiOutlineHome } from "react-icons/ai";
import { RiAddCircleLine } from "react-icons/ri";
import { BsList } from "react-icons/bs";


import { MdFormatListBulleted } from "react-icons/md";
import { FcStatistics } from "react-icons/fc";
import "./App.css"

function App() {

  return (
    <Router>
      {/* Navbar */}
      <nav className="nav flex">
        <div className="nav-logo flex">
          <a
            href="https://docs.google.com/spreadsheets/d/1HJ0Caotw7JKrtmR0f-ReRFWgtJu6fmvSGJIV901XTUw/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/sheet-icon.png" alt="Google Sheets" width={40} />
          </a>

          <h3>
            <Link to="/" className="nav-option-acceuil">
              Gestion de Commerce
            </Link>
           
          </h3>
        </div>

        <div className="nav-options-icons">
          <h3>
            <Link to="/">
              Gestion de Commerce
            </Link>
           
          </h3>
        </div>

        <div className="nav-options flex">
          <Link to="/" className="nav-option">Accueil</Link>
          <Link to="/inserer" className="nav-option">Insérer</Link>
          <Link to="/commandes" className="nav-option">Commandes</Link>
          <Link to="/statistiques" className="nav-option">Statistiques</Link>
        </div>

        {/* ✅ Icône Instagram qui ouvre l’application ou le site */}
        <a
          href="https://www.instagram.com/"  // lien pour ouvrir l’app
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/images/instagram.png" alt="Instagram" width={40} style={{ cursor: "pointer" }}/>
        </a>
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
