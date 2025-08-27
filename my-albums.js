import { estado } from './estados.js';
import { fadeInColumn, obtenerModo, cargarTracklist } from './script.js';
import { auth, db } from './database.js';
import { guardarPuntuacion, obtenerComentario, obtenerPuntuacion, guardarComentario, obtenerFavoritos, guardarFavorito, eliminarFavorito } from './userdata.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


