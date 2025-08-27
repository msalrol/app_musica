import { generarGradientDesdeIds } from './aura.js';
import { estado } from './estados.js';
import { buscarTermino, aplicarFiltradoGenero, aplicarFiltrado } from './busqueda.js';
import { activarBotonFavoritoIndividual, mostrarAlbumesFavoritos, resetEstadoFavoritos, obtenerFavoritos, mostrarAlbumesGuardados } from './favoritos.js'
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { auth, db } from './database.js';

const albumsPorPagina = 10;
let cargando = false;


document.addEventListener("DOMContentLoaded", async () => {

  const parmAlbum = new URLSearchParams(window.location.search);
  //llamada de boton fav individual

  if(parmAlbum.has('favourites')){
    mostrarAlbumesFavoritos();
  }

  if(parmAlbum.has('search')){

    const busqueda = parmAlbum.get('search');
    await buscarTermino(busqueda);
  }
  //llamadas genero individual 
 
  const tieneGeneroUrl = parmAlbum.has('genero');
  const generoUrl = tieneGeneroUrl ? Number(parmAlbum.get('genero')) : null;

  const modo = obtenerModo();
  if (modo === 'dark') document.body.classList.add('dark-mode');

  const nuevoIcono = modo === 'dark' ? 'moon' : 'sun';
  const nuevoColor = modo === 'dark' ? 'black' : 'white';
  document.getElementById('modo-tema').innerHTML =
    `<i data-feather="${nuevoIcono}" style="stroke:${nuevoColor}"></i>`;

  fadeInColumn();

  onAuthStateChanged(auth, async user => {
    console.log(user ? "Usuario autenticado:" : "No hay sesión iniciada", user?.uid || '');

    const albumes = await cargarDatos();
    estado.todosLosAlbumes = albumes;
    estado.albumesFiltrados = albumes;
    estado.paginaActual = 0;

    // Si NO hay género en la URL, mostramos rápido
    if (parmAlbum.has('favourites') && user) {
      await mostrarAlbumesFavoritos();
    } else if (!tieneGeneroUrl || isNaN(generoUrl)) {
      await mostrarPagina(estado.paginaActual);
      cargarGenerosAsincrono();
    } else {
      await cargarGenerosAsincrono();
      aplicarFiltradoGenero(generoUrl);
    }
  

    feather.replace();
  });
});



// Conectar botones de género
const botonesGenero = document.querySelectorAll('[data-genre]');
botonesGenero.forEach(boton => {
  boton.addEventListener('click', () => {
    resetEstadoFavoritos();
    const idGenero = Number(boton.getAttribute('data-genre'));
    setTimeout(() => {
      aplicarFiltradoGenero(idGenero);
    }, 0);
  });
});

//SCROLL INFINITO
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 50)) {
    cargarSiguientePagina();
  }
});

function cargarSiguientePagina() {
  if (cargando) return;   // Si ya está cargando, no hacer nada

  cargando = true;       // Marcar que empieza la carga
  estado.paginaActual++;

  let inicio = estado.paginaActual * albumsPorPagina;
  let final = inicio + albumsPorPagina;

  // Si no hay más álbumes, no hacer nada
  if (inicio >= estado.albumesFiltrados.length) {
    cargando = false;
    return;
  }

  // Mostrar los álbumes de esta página
  mostrarPagina(estado.paginaActual);

  cargando = false;      // Marcar que terminó la carga
}


//CARGA DE DATOS Y MOSTRAR EN PÁGINA

async function cargarDatos() {
  const urlDeezer = 'https://api.deezer.com/chart/0/albums?limit=130';
  const response = await fetch(estado.urlLocal + urlDeezer);
  const data = await response.json();
  
  // Guardamos los álbumes sin género aún
  return data.data.map(album => ({ ...album, genre_id: null }));
}

export async function mostrarPagina(pagina) {
  const gridAlbumes = document.querySelector('.album-grid');
  if (!gridAlbumes) return; // 🚨 Solución para evitar el error en otras páginas
  const inicio = pagina * albumsPorPagina;
  const final = inicio + albumsPorPagina;
  const albumesPagina = estado.albumesFiltrados.slice(inicio, final);

  const userId = auth.currentUser?.uid;

  const htmlAlbumes = await Promise.all(albumesPagina.map(async album => {
    // Evitamos duplicados
    if (document.querySelector(`.album-card[data-id="${album.id}"]`)) return '';

    let esFavorito = false;
    let estaGuardado = false;
    if (userId) {
      try {
        const favoritos = await obtenerFavoritos(userId);  // Solo UNA vez
        const guardados = await obtenerAlbumGeneral(userId);
        esFavorito = favoritos.some(fav => fav.id === album.id);
        estaGuardado = guardados.some(guard => guard.id === album.id);
      } catch (e) {
        console.error('Error al obtener favoritos:', e);
      }
    }

    return await crearElementoLista(album, esFavorito, estaGuardado);
  }));

  await htmlAlbumes.forEach(html => {
    if (html) gridAlbumes.insertAdjacentHTML("beforeend", html);
  });

  // Animación
  document.querySelectorAll('.fade-in-init').forEach(card => {
    void card.offsetWidth;
    card.classList.add('fade-in');
  });

  // Activamos botones y datos adicionales
  albumesPagina.forEach(album => {
    cargarTracklist(album.id);
    activarBotonToggleIndividual(album.id);
    activarBotonFavoritoIndividual(album.id);

    //Mandamos al álbum individual
    const albumCard = document.querySelector(`.album-card[data-id="${album.id}"]`);
    albumCard.addEventListener('click', () => {
      if (!userId) {
        mostrarAvisoLoginAlbumCard(albumCard);
      } else {
        window.location.href = `album.html?id=${album.id}`;
      }

    })
  });

  feather.replace();
}
export function fadeInColumn() {
  const columna = document.querySelectorAll('.fade-in-col');
  setTimeout(() => {
    columna.forEach(col => { col.classList.add('fade-in-act') })
  }, 0);

}

export async function cargarTracklist(albumId) {
  const urlTracklist = `https://api.deezer.com/album/${albumId}`;
  fetch(estado.urlLocal + urlTracklist)
    .then(res => res.json())
    .then(data => {

      if (!data.tracks || !data.tracks.data) {
        console.warn('No se pudo cargar la selección');
        return;
      }

      const tracklist = data.tracks.data.map(track => track.title).join(' / ');
      const toggleTracklist = document.querySelector(`.album-card[data-id="${albumId}"]`);
      if (toggleTracklist) {
        toggleTracklist.querySelector('.tracklist').innerHTML = tracklist;
      }
    }).catch(error => {
      console.error(`Error cargando la tracklist del álbum ${albumId}:`, error);
    });
}
export async function cargarGenerosAsincrono(albumes = estado.todosLosAlbumes) {

  for (let i = 0; i < albumes.length; i++) {
    const album = albumes[i];
    try {
      const detallesResponse = await fetch(`${estado.urlLocal}https://api.deezer.com/album/${album.id}`);
      const detalles = await detallesResponse.json();
      const genreId = detalles.genres?.data?.[0]?.id || null;
      const nombreGenero = detalles.genres?.data?.[0]?.name || '';
      album.genre_id = genreId;
      album.release_date = detalles.release_date || '';
      album.genre_name = nombreGenero;

      actualizarGeneroUI(album.id, genreId, nombreGenero, albumes);
    } catch (error) {
      console.error('Error cargando género de album', album.id, error);
    }
  }



  function actualizarGeneroUI(albumId, genreId, nombreGenero, albumesFiltrado = todosLosAlbumes) {
    const albumCard = document.querySelector(`.album-card[data-id="${albumId}"]`);
    const elementoGenero = document.querySelector(`.album-card[data-id="${albumId}"] .genre`);
    if (!elementoGenero) { return };
    const publicadoP = albumCard.querySelector('.publicado');
    const album = albumesFiltrado.find(alb => alb.id == albumId);
    const fechaAlbum = album?.release_date ? new Date(album.release_date) : null;
    publicadoP.textContent = `${fechaAlbum.toLocaleDateString()} | ${nombreGenero || 'Desconocido'}.`;
  }
}

// Aquí tu función crearElementoLista sin cambios (solo actualiza genre_id si lo tienes)

async function crearElementoLista(album, esFavorito, estaGuardado) {
  const { id, title, artist, cover_xl, genre_id, release_date } = album;
  const artistName = album.artist?.name ?? 'Artista desconocido';
  return `<div class="album-card fade-in-init" data-id="${id}">
<img src="${cover_xl}"
    alt=${cover_xl}" class="img-fluid">
<div class="album-info row mt-2">
    <div class="col-8">
        <p>${artistName} / ${title}</p>
    </div>
    <div class="col-4 text-end"style="text-align:right">
        <div class="botones-album"></div>
        <div class="aviso-favorito-carta">INICIA SESIÓN PARA GUARDAR FAVORITOS</div>
        <button class="btn btn-save" data-id="${album.id}"><i class="${estaGuardado ? 'guardado' : ''}" data-feather="plus"></i></button>
        <button class="btn btn-fav" data-id="${album.id}"><i class="${esFavorito ? 'favorito' : ''}" data-feather="star"></i></button>
        <button class="btn btn-sm  toggle-tracks"><i class="mostrar" data-feather="info"></i></button>
    </div>
</div>

<!-- Sección oculta con canciones -->
<div class="album-tracks mt-2">
   <p class="tracklist">Track list:<br></p>
    <p class="publicado mt-2 text-muted">Álbum publicado en ${release_date}. Género: ${genre_id || 'Cargando...'}.</p>
</div>
</div>`;

}

//filtrosparamovil
const botonFiltrosMovil = document.querySelector('.boton-movil-filtros');

botonFiltrosMovil.addEventListener('click', () => {
  const filtros = document.querySelector('.filtros-movil');
  filtros.classList.toggle('show');

  const icono = document.querySelector('.icono-flecha');
  icono.classList.toggle('clicked');
});

//Sesión movil
function moverSesion() {
  const sesion = document.querySelector('.sesion-iniciada');
  const contenedorMovil = document.getElementById('zona-movil');
  const contenedorEscritorio = document.getElementById('zona-escritorio');

  if (window.innerWidth <= 768) {
    contenedorMovil.appendChild(sesion);
  } else {
    contenedorEscritorio.appendChild(sesion);
  }
}

function moverFavoritos() {
  const favoritos = document.querySelector('.seccion-favoritos')
  const contenedorMovil = document.getElementById('favoritos-movil')
  const contenedorEscritorio = document.getElementById('favoritos-escritorio')

  if (window.innerWidth <= 768) {
    contenedorMovil.appendChild(favoritos);
  }
  else {
    contenedorEscritorio.appendChild(favoritos)
  }
}
// Ejecutar al cargar

// Y cuando se redimensione
window.addEventListener('resize', moverSesion);
window.addEventListener('resize', moverFavoritos);

//TOGGLE INFORMACIÓN DISCO
function activarBotonToggleIndividual(albumId) {
  const albumCard = document.querySelector(`.album-card[data-id="${albumId}"]`);
  const toggleBtn = albumCard?.querySelector('.toggle-tracks');
  const info = albumCard?.querySelector('.album-tracks');

  if (toggleBtn && info) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      info.classList.toggle('open');
    });
  }
}

//SWITCH MODO COLOR

//Comprobar modo del album
export function obtenerModo() {
  return localStorage.getItem('modo');
}
function guardarModo(modo) {
  localStorage.setItem('modo', modo);
}
document.getElementById('modo-tema').addEventListener('click', function () {
  document.body.classList.toggle('dark-mode');

  // Guardar el nuevo modo
  const modoActual = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  guardarModo(modoActual);

  // Actualizar icono según nuevo modo
  const nuevoIcono = modoActual === 'dark' ? 'moon' : 'sun';
  const nuevoColor = modoActual === 'dark' ? 'black' : 'white';

  this.innerHTML = `<i data-feather="${nuevoIcono}" style="stroke:${nuevoColor}"></i>`;
  feather.replace(); // <-- MUY IMPORTANTE: llama a feather.replace después de cambiar el innerHTML
});


//INICIO DE SESIÓN

import { registerUser, loginUser, logoutUser, saveUserProfile } from './auth.js';

//botonesformulario
const loginBtn = document.getElementById('btn-login');
const registerBtn = document.getElementById('btn-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');


loginBtn.addEventListener('click', () => {
  loginBtn.classList.add('active');
  registerBtn.classList.remove('active');
  formLogin.style.display = 'block';
  formRegister.style.display = 'none';

})
registerBtn.addEventListener('click', () => {
  registerBtn.classList.add('active');
  loginBtn.classList.remove('active');
  formRegister.style.display = 'block';
  formLogin.style.display = 'none';
})

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(formLogin);
  const email = formData.get('email');
  const password = formData.get('password');
  loginUser(email, password);
  formLogin.reset();
})

formRegister.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(formRegister);
  const email = formData.get('email');
  const username = formData.get('username');
  const password = formData.get('password');
  registerUser(email, password, username);
  formLogin.reset();
})


import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { obtenerAlbumGeneral } from './userData.js';

//Comprobar si sesión esta inciada para el user
document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);

      // Si no hay perfil guardado, lo creamos automáticamente
      if (!snapshot.exists()) {
        await saveUserProfile(user.uid, {
          email: user.email,
          username: user.email.split('@')[0], // nombre provisional
          createdAt: new Date().toISOString()
        });
      }

      // Leemos los datos actualizados (ya sea existentes o recién creados)
      const data = (await get(userRef)).val();
      const username = data.username || 'usuario';
      console.log('Datos del usuario:', data);
      localStorage.setItem('username', username);

      // Mostrar la tarjeta del usuario
      const tarjetaUsuario = document.querySelector('.sesion-iniciada');
      tarjetaUsuario.innerHTML = `
        <p class="mb-2">${username}</p>
        <button id="logout" style="font-size:11px;">LOG OUT</button>
      `;
      tarjetaUsuario.style.display = 'block';
      document.querySelector('.bloque-form').style.display = 'none';
      moverSesion();
      moverFavoritos();

      // Logout
      document.getElementById('logout').addEventListener('click', () => {
        logoutUser();
        localStorage.removeItem('username');
        location.reload();
      });
    }
  })
});