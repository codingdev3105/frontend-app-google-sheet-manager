
import axios from "axios"; 


// "https://backend-app-google-sheet-manager.vercel.app"
// "http://localhost:5000"

const API_URL = "https://backend-app-google-sheet-manager.vercel.app";


export async function Get_Commandes() {
  const res = await axios.post(`${API_URL}/sheets/get`,{
    feuile:'commandes'
  });  
  console.log(res.data)
  return res.data;
}

export async function Get_wilayas() {
  const res = await axios.post(`${API_URL}/sheets/get`,{
    feuile:'code wilayas'
  }); 
  return res.data;
}

export async function Get_Communes(wilaya_id) {
  const res = await axios.post(`${API_URL}/sheets/get`,{
    feuile:'code communes'
  }); 

  const all_communes = res.data;
  const filtred_communes = []
  if(wilaya_id){
    all_communes.map((commune)=>{
      if(commune['Code de la wilaya'] == wilaya_id){
        filtred_communes.push(commune)
      }
    })
    return filtred_communes
  }
  else{
    return all_communes
  }  
}

export async function Get_stations() {
  const res = await axios.post(`${API_URL}/sheets/get`,{
    feuile:'code stations'
  }); 
  return res.data;
}

export async function Add_Commandes(commande) {
  const res = await axios.post(`${API_URL}/sheets/add`, { commande: commande });
  return res.data;
}
