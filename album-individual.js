import { estado } from './estados.js';
import { fadeInColumn, obtenerModo, cargarTracklist } from './script.js';
import { auth, db } from './database.js';
import { guardarPuntuacion, obtenerComentario, obtenerPuntuacion, guardarComentario, obtenerFavoritos, guardarFavorito, eliminarFavorito } from './userdata.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



const params = new URLSearchParams(window.location.search)
const albumId = params.get('id');
let albumIndividual = [];
let albumesArtista = [];



document.addEventListener('DOMContentLoaded', async () => {

    //Modo dark/light
    const modo = obtenerModo();

    if (modo === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const nuevoIcono = modo === 'dark' ? 'moon' : 'sun';
    const nuevoColor = modo === 'dark' ? 'black' : 'white';

    document.getElementById('modo-tema').innerHTML =
        `<i data-feather="${nuevoIcono}" style="stroke:${nuevoColor}"></i>`;

    fadeInColumn();

    //Comprobamos sesión y pasamos puntuación
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
        let puntuacionBaseDatos = '';
        let comentarioBaseDatos = '';
        if (user) {
            puntuacionBaseDatos = await obtenerPuntuacion(user.uid, albumId);
            comentarioBaseDatos = await obtenerComentario(user.uid, albumId);


        }
        albumIndividual = await datosAlbumIndividual(albumId);
        albumesArtista = await datosAlbumesArtista(albumIndividual.artist.id);
        mostrarPaginaIndividual(puntuacionBaseDatos, comentarioBaseDatos);
        //console.log(albumesArtista);
        mostrarAlbumesRelacionados();

        activarBotonFavoritoAlbum(albumIndividual);
        //CargamosPuntuacion form
        inicializarFormularioPuntuacion()
        inicializarFormularioComentario()
    })

    //CargamosPágina



})
//ÁLBUM INDIVIDUAL E INFORMACIÓN
async function mostrarPaginaIndividual(puntuacionBaseDatos = '', comentarioBaseDatos = '') {
    const albumGrid = document.querySelector('.album-individual');
    let esFavorito = false;
    //console.log(comentarioBaseDatos);
    // 1. Creamos HTML
    const elementoHtml = crearAlbumIndividualHtml(albumIndividual, esFavorito, puntuacionBaseDatos, comentarioBaseDatos);
    albumGrid.innerHTML = elementoHtml;

    // 2. Insertamos los íconos de feather
    feather.replace();

    // 3. Ahora sí: cargamos la tracklist (el DOM ya existe)
    await cargarTracklist(albumId);
}

//Creamos albumes relacionados en el dom

function mostrarAlbumesRelacionados() {
    const albumGridRelacionados = document.querySelector('.related-albums');

    albumesArtista.slice(0, 6).forEach(album => {
        //console.log(album);
        if (document.querySelector(`.related-albums-cell[data-id="${album.id}"]`)) return '';
        const albumCellHtml = crearAlbumRelacionado(album);
        albumGridRelacionados.insertAdjacentHTML("beforeend", albumCellHtml);

        albumGridRelacionados.addEventListener('click', (e) => {
            const albumIndividual = e.target.closest('.related-albums-cell');
            const id = albumIndividual.dataset.id
            window.location.href = `album.html?id=${id}`;
        })

    });
}

//obtenemos datos album

async function datosAlbumIndividual(albumId) {
    const urlIndividual = `https://api.deezer.com/album/${albumId}`
    try {
        const res = await fetch(estado.urlLocal + urlIndividual);
        const data = await res.json();
        return data;
    } catch (error) {
        console.log('Error al cargar álbumes', error);
    }
}

//obtenemosDatos artista

async function datosAlbumesArtista(artistId) {
    const urlIndividual = `https://api.deezer.com/artist/${artistId}/albums`;

    try {
        const res = await fetch(estado.urlLocal + urlIndividual);
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.log('No se han podido obtener los datos', error);
    }
}
//Creamos html album
function crearAlbumIndividualHtml(album, esFavorito, puntuacion, comentarioBaseDatos) {
    const { id, title, artist, cover_xl, genre_id, release_date } = album;
    return `
<div class="row album-individual album-card"  data-id="${id}">
    <div class="col-12 col-md-4">
        <img src="${cover_xl}">
 
        <p class="pb-2 pt-2" style="border-bottom:0.5px solid white;">NOTES</p>
        <form id="formComentario">
        <textarea name="comentario" placeholder="Add notes...">${comentarioBaseDatos}</textarea>
       
        </form>
        
    </div>
    <div class="col-12 col-md-8 pr-3">
    <div class="album-card" style="height: 100%;">
    <div class="d-flex pb-5 align-items-start g-3"> <!-- ¡Esto empuja hacia abajo! -->
    <form id="puntuacion-album">
      <input class="numero" type="text" name="puntuacion" placeholder="0.0" value="${puntuacion}">
    </form>
    <button class="btn btn-fav ml-2 ml-md-4" data-id="${album.id}"><i class="${esFavorito ? 'favorito' : ''}" data-feather="star"></i></button>
  </div>
      <p class="pb-3" style="text-transform:uppercase">${title} - ${artist.name}</p>
      <p>YEAR: ${release_date} <span style="margin-left: 30px;">GENRE: ${genre_id}</span></p>
      <div class="informacion pb-3">
      <p class="pt-3">TRACKLIST</p>
      <p class="tracklist pt-1">Track list:<br></p>
      </div>
  
    </div>
  </div>
    <p class=" p-3 pt-5 mt-4 pb-2">RELATED ARTIST'S ALBUMS</p>
    <div class="row related-albums p-4">
    </div>
</div>`
}

//creamos html artista relacionados
function crearAlbumRelacionado(album) {

    const { title, cover_xl, id } = album;
    return `    <div class="related-albums-cell" data-id="${id}">
<div class="d-flex align-items-end g-2">
    <img src="${cover_xl}" alt="Portada album ${title}">
    <p class="ml-3">${title}</p>
</div>
</div>
`

}

//FORM PUNTUACIÓN

function inicializarFormularioPuntuacion(userId) {
    const formPuntuacion = document.getElementById('puntuacion-album');
    if (!formPuntuacion) {
        console.warn('Formulario puntuación no encontrado');
        return;
    }

    formPuntuacion.addEventListener('input', async (e) => {
        e.preventDefault();
        const formularioDato = new FormData(formPuntuacion);
        const puntuacion = formularioDato.get('puntuacion');
        const userId = auth.currentUser?.uid;


        const puntuacionNum = parseFloat(puntuacion.replace(',', '.'));
        if (isNaN(puntuacionNum) || puntuacionNum < 1 || puntuacionNum > 10) {
            alert('Introduce un número entre 1 y 10');
            return;
        }
        const regex = /^([1-9](\.\d)?|10(\.0)?)$/;

        if (!regex.test(puntuacion.replace(',', '.'))) {
            
            return;
        }
        console.log('Guardando puntuación para userId:', userId, 'albumId:', albumId, 'puntuacion:', puntuacionNum);
        if (!userId) {
            alert('Debes iniciar sesión para guardar puntuación.');
            return;
        }
        try {
            // Aquí guardas la puntuación en Firebase y actualizas la UI
            console.log('Puntuación válida:', puntuacionNum);

            await guardarPuntuacion(userId, albumId, puntuacionNum)
                .then(() => console.log('Puntuación guardada correctamente'))
                .catch(err => console.error('Error guardando puntuación:', err));
            formPuntuacion.querySelector('input[name="puntuacion"]').value = puntuacionNum;

        } catch (error) {
            console.log('Error al guardar puntuación', error)

        }
    });
}
//FORM COMENTARIO

function inicializarFormularioComentario() {
    const formComentario = document.getElementById('formComentario');
    const textarea = formComentario.querySelector('textarea[name="comentario"]');

    if (!formComentario) {
        console.log('ERROR CARGAR FORM')
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
        alert('Inicia sesión para guardar un comentario');
    }


    textarea.addEventListener('input', async () => {
        const comentario = textarea.value;
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            await guardarComentario(userId, albumId, comentario);
            console.log('Comentario guardado automáticamente');
        } catch (error) {
            console.error('Error al guardar el comentario:', error);
        }
    });

}

//COMPROBAR Y ACTIVAR FAVORITO PARA EL ALBUM

async function activarBotonFavoritoAlbum(album) {
    const userId = auth.currentUser?.uid
    const albumCard = document.querySelector(`.album-individual[data-id="${album.id}"]`)
    const botonFav = albumCard.querySelector('.btn-fav');
    let favoritos = await obtenerFavoritos(userId);

    const esFavorito = favoritos.some(fav => fav.id === album.id);
    if (esFavorito) {
        botonFav.classList.add('favorito')
    }

    botonFav.addEventListener('click', async () => {
        const esfavoritoAhora = favoritos.some(fav => fav.id === album.id);
        if (!esfavoritoAhora) {
            favoritos.push(album);
            try {
                await guardarFavorito(album);
                botonFav.classList.add('favorito')
            } catch (error) {
                console.log(error)
            }
        } else {
            favoritos = favoritos.filter(fav => fav.id === album.id);
            try {
                await eliminarFavorito(favoritos);
                botonFav.classList.remove('favorito')
            } catch (error) {
                console.log(error)
            }
        }

    })

}

/*Mostrar favoritos
const mostrarFavoritos = document.querySelector('.btn-favourites');

mostrarFavoritos.addEventListener('click', () => {
    window.location.href = 'index.html?favourites=true';
})
*/

//Buscar form search
const buscarPorTermino = document.getElementById('buscarInterna')
buscarPorTermino.addEventListener('submit', (e) => {
    e.preventDefault();
    let busquedaForm = new FormData(buscarPorTermino);
    const busqueda = busquedaForm.get('busqueda')

    window.location.href = `index.html?search=${busqueda}`;
})
