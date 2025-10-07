import { Link } from "react-router-dom";
import "./Home.css";
import { MdOutlineAddCircle } from "react-icons/md";
import { MdFormatListBulleted } from "react-icons/md";
import { FcStatistics } from "react-icons/fc";

export default function Home() {
  return (
    <div className="home flex">
      <h3 className="">Bienvenue sur la plateforme</h3>
      <div className="home-btns flex">
        <Link to="/inserer" className="home-btns-btn flex">
          <MdOutlineAddCircle className="home-btns-btn-icon"/> Insérer une commande
        </Link>
        <Link to="/commandes" className="home-btns-btn flex">
          <MdFormatListBulleted className="home-btns-btn-icon"/> Voir les commandes
        </Link>
        <Link to="/statistiques" className="home-btns-btn flex">
          <FcStatistics className="home-btns-btn-icon"/> Voir les statistiques
        </Link>
      </div> 
    </div>
  );
}
