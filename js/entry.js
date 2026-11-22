// Point d'entrée : expose Pawnote (connexion Pronote) et jsQR (lecture des QR codes) dans la page
import * as Pawnote from 'pawnote';
import jsQR from 'jsqr';
window.Pawnote = Pawnote;
window.jsQR = jsQR;
