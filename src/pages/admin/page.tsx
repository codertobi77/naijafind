import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const mockStats = {
  fournisseurs: 12,
  utilisateurs: 350,
  commandes: 80,
  avis: 31,
  caTotal: 3400000,
};
const mockSuppliers = [
  {id: 1, name: 'ABC Ltd', email:'abc@company.com', active:true},
  {id: 2, name: 'Soleil SARL', email:'hello@soleil.com', active:false},
  {id: 3, name: 'Digitex', email:'contact@digitex.ng', active:true},
];
const mockOrders = [
  {id:1,num:'0001', montant:15000, date:Date.now()-9000000, supplier:'ABC Ltd'},
  {id:2,num:'0002', montant:32000, date:Date.now()-700000, supplier:'Digitex'},
];
const mockReviews=[
  {id:1, user:'Ola K.', comment:'Super service', date:Date.now()-3200000},
  {id:2, user:'Helen', comment:'Livraison rapide', date:Date.now()-4300000},
];

export default function AdminPage(){
  const [fournisseurs,setFournisseurs] = useState(mockSuppliers);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
            NaijaFind ADMIN
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">Fournisseurs</div><div className="text-xl font-bold">{mockStats.fournisseurs}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">Utilisateurs</div><div className="text-xl font-bold">{mockStats.utilisateurs}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">Commandes</div><div className="text-xl font-bold">{mockStats.commandes}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">Avis</div><div className="text-xl font-bold">{mockStats.avis}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">CA Total</div><div className="text-xl font-bold">₦{mockStats.caTotal.toLocaleString()}</div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fournisseurs */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Fournisseurs</h3>
            <table className="min-w-full text-sm">
              <thead><tr><th>Nom</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {fournisseurs.map(f=>(
                  <tr key={f.id} className="border-b">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td>{f.email}</td>
                    <td>{f.active? <span className="text-green-600">Actif</span>: <span className="text-red-600">Inactif</span>}</td>
                    <td>
                      <button onClick={()=>setFournisseurs(list=>list.map(x=>x.id===f.id?{...x,active:!x.active}:x))} className="text-xs mr-1 px-2 py-1 rounded border border-gray-300 hover:bg-green-50">
                        {f.active?"Désactiver":"Activer"}
                      </button>
                      <button className="text-xs text-red-700 px-2 py-1 rounded border border-red-100 hover:bg-red-100" onClick={()=>setFournisseurs(list=>list.filter(x=>x.id!==f.id))}>Supprimer</button>
                    </td>
                  </tr>
                ))}
                {fournisseurs.length===0 && <tr><td colSpan={4} className="text-center text-gray-400 p-4">Aucun fournisseur</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Activité récente */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Activité récente</h3>
            <div className="mb-6">
              <div className="mb-2 text-sm font-bold">Dernières commandes</div>
              <ul className="pl-4 list-disc">
                {mockOrders.map(o=>(<li key={o.id} className="mb-1">Commande #{o.num}: ₦{o.montant.toLocaleString()} <span className="ml-2 text-gray-400 text-xs">({o.supplier})</span></li>))}
                {mockOrders.length===0 && <li className="text-gray-400">Aucune commande</li>}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">Derniers avis</div>
              <ul className="pl-4 list-disc">
                {mockReviews.map(r=>(<li key={r.id} className="mb-1">{r.user}: <span className="italic">"{r.comment}"</span></li>))}
                {mockReviews.length===0 && <li className="text-gray-400">Aucun avis</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
