import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, auth } from './database.js'; // Asegúrate de que database.js exporte auth y db


export function registerUser(email, password, username) {
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('Usuario registrado:', user);
  
        // Guardamos el perfil
        saveUserProfile(user.uid, {
          email: email,
          username: username,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('username', username);
        location.reload();
      })
      .catch(error => {
        console.error('Error en registro:', error.message);
      });
  }
  
export function loginUser(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Usuario logueado:', userCredential.user);
            location.reload();  
        })
        .catch(error => {
            console.error('Error en login:', error.message);
        });
}

export function logoutUser() {
    signOut(auth)
        .then(() => {
            console.log('Usuario desconectado');
        })
        .catch(error => {
            console.error('Error al cerrar sesión:', error.message);
        });
}


export async function saveUserProfile(userId, profileData) {
    set(ref(db, 'users/' + userId), profileData)
        .then(() => console.log('Perfil guardado'))
        .catch(e => console.error(e));
}

