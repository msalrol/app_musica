import { estado } from './estados.js';
import { mostrarPagina, cargarGenerosAsincrono } from './script.js';
import { resetEstadoFavoritos } from './favoritos.js';

export async function buscarTermino(termino) {
  try {
    const urlBusqueda = `${estado.urlLocal}https://api.deezer.com/search?q=${encodeURIComponent(termino)}&limit=100`;
    const response = await fetch(urlBusqueda);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      estado.albumesFiltrados = [];
      document.querySelector('.album-grid').innerHTML = '<p>No se encontraron resultados.</p>';
      return;
    }

    // Extraer álbumes únicos
    const albumMap = new Map();
    const artistMap = new Map();
    data.data.forEach(track => {
      const album = track.album;
      const artista = track.artist;
      if (!albumMap.has(album.id)) {
        albumMap.set(album.id, {
          ...album,
          artist: track.artist,
          genre_id: null, // aún no lo tenemos
          release_date: album.release_date || '' // a veces falta
        });
      }
      if (!artistMap.has(artista.id)) {
        artistMap.set(artista.id, {
          ...album,
          artist: track.artist,
          genre_id: null,
          release_date: album.release_date || ''
        });
      }
    });

    // Convertir mapas a arrays
    const albumsArray = Array.from(albumMap.values()).map(album => ({
      ...album,
      type: 'album',  // etiqueta para distinguir luego
      artist: album.artist || { name: 'Desconocido' },
      cover_xl: album.cover_xl || 'ruta-por-defecto.jpg',
      release_date: album.release_date || ''
    }));

    const artistsArray = Array.from(artistMap.values()).map(artist => ({
      ...artist,
      type: 'artist', // etiqueta para distinguir luego
      cover_xl: artist.picture_xl || 'ruta-por-defecto.jpg' // por ejemplo
    }));

    // Unir ambos arrays en uno solo
    estado.albumesFiltrados = [...albumsArray, ...artistsArray];

    // Luego mostrarPagina(paginaActual) mostrará ambos mezclados

    // Mostrar en pantalla
    document.querySelector('.album-grid').innerHTML = '';
    estado.paginaActual = 0;
    mostrarPagina(estado.paginaActual);

    // Añadir géneros poco a poco
    cargarGenerosAsincrono(estado.albumesFiltrados);
    resetEstadoFavoritos();


  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
}

const formSearch = document.getElementById('buscar');

if (formSearch) {
  formSearch.addEventListener('submit', function (e) {
    e.preventDefault();
    const valorBusqueda = formSearch.busqueda.value.trim();
    if (valorBusqueda !== '') {
      buscarTermino(valorBusqueda);
    }
    formSearch.reset();
  });
}


// Filtrado género usa genre_id actual (que irá llegando poco a poco)

export function aplicarFiltradoGenero(generoId) {
  if (generoId == 0) {
    estado.albumesFiltrados = [...estado.todosLosAlbumes];
  } else {
    estado.albumesFiltrados = estado.todosLosAlbumes.filter(album => album.genre_id == generoId);
  }
  document.querySelector('.album-grid').innerHTML = '';
  estado.paginaActual = 0;
  mostrarPagina(estado.paginaActual);
  resetEstadoFavoritos();
}


//APLICAR FILTROS

export function aplicarFiltrado(filtro) {
  if (filtro === 'popular') {
    estado.albumesFiltrados = [...estado.todosLosAlbumes];
  }
  if (filtro === 'latest') {
    estado.albumesFiltrados = [...estado.todosLosAlbumes].sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  }
  if (filtro === 'random') {
    estado.albumesFiltrados = [...estado.todosLosAlbumes].sort(() => Math.random() - 0.5);
  }
  document.querySelector('.album-grid').innerHTML = '';
  estado.paginaActual = 0;
  mostrarPagina(estado.paginaActual);

}

const filtros = document.querySelectorAll('[data-filter]');

filtros.forEach(boton => {
  boton.addEventListener('click', () => {
    const tipoBoton = boton.getAttribute('data-filter');
    aplicarFiltrado(tipoBoton);
    resetEstadoFavoritos();
  })
})