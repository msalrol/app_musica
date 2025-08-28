import { ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { db, auth } from './database.js';

export function guardarFavorito(album) {

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const albumRef = ref(db, `users/${userId}/albumes/favoritos/${album.id}`);
    return set(albumRef, album);

}


export function eliminarFavorito(album) {
    const userId = auth.currentUser?.uid;
    const albumRef = ref(db, `users/${userId}/albumes/favoritos/${album.id}`);
    return remove(albumRef, album);
}

export function obtenerFavoritos(userId) {
    const favsRef = ref(db, `users/${userId}/albumes/favoritos/`);
    return get(favsRef).then(snapshot => {
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        } else {
            return [];
        }
    })
}
//GUARDAR ALBUM GENERAL

export async function guardarAlbumGeneral(userId, album) {

    const refAlbum = ref(db, `users/${userId}/albumes/${album.id}/`)
    return set(refAlbum, album);
}
export async function obtenerAlbumGeneral(userId) {
    const refAlbum = ref(db, `users/${userId}/albumes/`);
    const snap = await get(refAlbum);

    if (!snap.exists()) return [];

    // convertimos a array y filtramos undefined/null
    return Object.values(snap.val()).filter(album => album.id != undefined);
}

export function eliminarAlbumGeneral(album) {
    const userId = auth.currentUser?.uid;
    const albumRef = ref(db, `users/${userId}/albumes/${album.id}`);
    return remove(albumRef, album);
}

//GUARDAR EN LA HEARLIST

export async function guardarHearList(albumId, userId) {

    const hearRef = ref(db, `users/${userId}/albumes/hearlist/${albumId}/`)
    return set(hearRef, albumId);
}

export async function obtenerHearList(albumId) {

    const hearRef = ref(db, `users/${userId}/albumes/hearlist/${albumId}/`);
    return get(hearRef).then(informacion => {
        if (informacion.exists()) {
            return Object.values(informacion.val());
        } else {
            return [];
        }
    })
}
//PUNTUACIONES ALBUM
export async function guardarPuntuacion(userId, albumId, puntuacion) {
    if (!userId) return;

    const puntuacionRef = ref(db, `users/${userId}/puntuaciones/${albumId}/puntuacion`);
    return set(puntuacionRef, puntuacion);
}

export async function obtenerPuntuacion(userId, albumId) {
    const puntuacionRef = ref(db, `users/${userId}/puntuaciones/${albumId}/puntuacion`);
    const snapshot = await get(puntuacionRef);

    if (snapshot.exists()) {
        return snapshot.val(); // devuelve la puntuación (número o string)
    } else {
        return ''; // si no existe, devolver cadena vacía para evitar errores
    }
}

export async function guardarComentario(userId, albumId, comentario) {
    if (!userId) { return };

    const comentarioRef = ref(db, `users/${userId}/puntuaciones/${albumId}/comentario`)
    return set(comentarioRef, comentario)
}

export async function obtenerComentario(userId, albumId) {
    if (!userId) { return };

    const comentarioRef = ref(db, `users/${userId}/puntuaciones/${albumId}/comentario`);
    const informacion = await get(comentarioRef);

    if (informacion.exists()) {
        return informacion.val();
    } else {
        return '';
    }

}