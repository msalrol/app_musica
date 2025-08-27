//ÁLBUMES FAVORITOS
import { guardarFavorito, eliminarFavorito, obtenerFavoritos, obtenerAlbumGeneral, eliminarAlbumGeneral, guardarAlbumGeneral } from './userData.js';
import { auth, db } from './database.js';
import { estado } from './estados.js';
import { mostrarPagina } from './script.js';
import { generarGradientDesdeIds } from './aura.js'


function activarBotonFavoritoIndividual(albumId) {
  const albumCard = document.querySelector(`.album-card[data-id="${albumId}"]`);
  const boton = albumCard?.querySelector('.btn-fav');
  const botonAlbumGeneral = albumCard?.querySelector('.btn-save');
  if (!boton) return;
  if (!botonAlbumGeneral) return;

  const album = estado.albumesFiltrados.find(a => a.id === albumId) || estado.todosLosAlbumes.find(a => a.id === albumId);
  if (!album) return;

  const userId = auth.currentUser?.uid;
  //Verificar si está guardado en la base de datos
  obtenerAlbumGeneral(userId).then(albumGuardado => {
    const estaGuardado = albumGuardado.some(saved => saved.id === albumId);
    if (estaGuardado) {
      botonAlbumGeneral.classList.add('botonGirado');
    }

    botonAlbumGeneral.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!userId) {
        mostrarAvisoLoginAlbumCard(albumCard);
        return
      }
      const estaGuardadoActualizado = await obtenerAlbumGeneral(userId);
      const estaGuardadoAhora = estaGuardadoActualizado.some(saved => saved.id === albumId);

      if(!estaGuardadoAhora){
        await guardarAlbumGeneral(userId, album);
        botonAlbumGeneral.classList.add('botonGirado');
      }else{
        eliminarAlbumGeneral(album);
        botonAlbumGeneral.classList.remove('botonGirado')
      }

    })
  })


  // Verificar si ya es favorito en la base de datos
  obtenerFavoritos(userId).then(favoritos => {
    const esFavorito = favoritos.some(fav => fav.id === albumId);
    if (esFavorito) {
      boton.classList.add('favorito');
    }

    boton.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!userId) {
        mostrarAvisoLoginAlbumCard(albumCard);
        return
      }

      const favoritosActualizados = await obtenerFavoritos(userId);
      const esFavoritoAhora = favoritosActualizados.some(fav => fav.id === albumId);


      if (!esFavoritoAhora) {
        await guardarFavorito(album); // Guarda solo uno
        boton.classList.add('favorito');
      } else {
        await eliminarFavorito(album); // Elimina solo ese
        boton.classList.remove('favorito');
      }
    });
  });
}



//BOTONFAVORITOS
const botonFavoritos = document.querySelector('.btn-favourites');

if (botonFavoritos) {
  botonFavoritos.addEventListener('click', async () => {

    const userId = auth.currentUser?.uid;
    if (!userId) { mostrarAvisoLogin(); return; }


    await mostrarAlbumesFavoritos();

    // Espera un poco a que feather reemplace los íconos
    feather.replace(); // ← Muy importante

    // Ahora seleccionamos el SVG generado por Feather
    const estrellaSvg = botonFavoritos.querySelector('svg');

    if (estrellaSvg) {
      estrellaSvg.style.fill = 'gold';
      estrellaSvg.style.stroke = 'gold';
      estrellaSvg.style.strokeWidth = '0.5px';
      estrellaSvg.style.transition = 'all 0.2s ease';
    }

    // Agregamos el botón de AURA si no existe
    const columnaFavoritos = document.querySelector('.columna-favoritos');

    if (!document.querySelector('.btn-aura')) {
      const botonHtml = '<button class="btn-aura mt-3">MY AURA</button>';
      columnaFavoritos.insertAdjacentHTML('beforeend', botonHtml);
    }

    // Creamos la capa de fondo si no existe
    if (!document.querySelector('.aura-bg')) {
      const div = document.createElement('div');
      div.classList.add('aura-bg');
      document.body.appendChild(div);
    }

    // Añadir listener SOLO la primera vez que se crea el botón aura
    const botonAura = document.querySelector('.btn-aura');

    botonAura.addEventListener('click', async () => {
      const auraBg = document.querySelector('.aura-bg');

      if (!botonAura.classList.contains('active')) {
        // Activar aura
        botonAura.classList.add('active');

        const userId = auth.currentUser?.uid;
        const favoritos = await obtenerFavoritos(userId);
        const ids = favoritos.map(fav => fav.id);

        const gradiente = generarGradientDesdeIds(ids);

        if (!auraBg) {
          const div = document.createElement('div');
          div.classList.add('aura-bg');
          document.body.appendChild(div);
        }

        if (auraBg) {
          auraBg.style.backgroundImage = gradiente;
          auraBg.style.opacity = '0.4';
        }

        const isDarkMode =
          window.matchMedia('(prefers-color-scheme: dark)').matches ||
          document.body.classList.contains('dark-mode');
        document.body.style.backgroundColor = isDarkMode ? '#000000' : '#ffffff';

      } else {
        // Desactivar aura
        botonAura.classList.remove('active');

        if (auraBg) {
          auraBg.style.opacity = '0';
          setTimeout(() => {
            auraBg.style.backgroundImage = 'none';
          }, 300);
        }

        const isDarkMode =
          window.matchMedia('(prefers-color-scheme: dark)').matches ||
          document.body.classList.contains('dark-mode');
        document.body.style.backgroundColor = isDarkMode ? '#000000' : '#ffffff';
      }
    });

  });
}

//MOSTRAR TODOS LOS ALBUMES

const botonMostrarAlbumes = document.getElementById('myalbums');

botonMostrarAlbumes.addEventListener('click', () => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    mostrarAvisoInicioSesion();
  } else {
    mostrarAlbumesGuardados(userId);
  }
})

export async function mostrarAlbumesGuardados(userId) {

  const albumesGuardados = await obtenerAlbumGeneral(userId);
  if (!albumesGuardados) { return };

  estado.albumesFiltrados = albumesGuardados;
  if (estado.albumesFiltrados.length === 0) {
    document.querySelector('.album-grid').innerHTML = '<div class="pt-5">No hay ningún álbum en favoritos.</div>';
  } else {
    document.querySelector('.album-grid').innerHTML = '';
    estado.paginaActual = 0;
    mostrarPagina(estado.paginaActual);
  }
}
//MOSTRAR ÁLBUMES FAVORITOS

async function mostrarAlbumesFavoritos() {
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  2
  const albumesFavoritos = await obtenerFavoritos(userId);
  estado.albumesFiltrados = albumesFavoritos;
  if (estado.albumesFiltrados.length === 0) {
    document.querySelector('.album-grid').innerHTML = '<div class="pt-5">No hay ningún álbum en favoritos.</div>';
  } else {
    document.querySelector('.album-grid').innerHTML = '';
    estado.paginaActual = 0;
    mostrarPagina(estado.paginaActual);
  }
}
//aviso si no se ha iniciado sesión

function mostrarAvisoLogin() {

  const avisoLogin = document.querySelector('.aviso-mostrar')
  if (!avisoLogin) { return };

  avisoLogin.classList.add('visible')
  setTimeout(() => {
    avisoLogin.classList.remove('visible')
  }
    , 3000);

}
function mostrarAvisoLoginAlbumCard(albumCard) {
  const avisoAlbum = albumCard.querySelector('.aviso-favorito-carta');
  if (!avisoAlbum) { return };
  avisoAlbum.classList.add('visible');
  setTimeout(() => {
    avisoAlbum.classList.remove('visible');
  }, 2500);

}
//dejarMarcadoFavoritos - botón aura

function resetEstadoFavoritos() {
  const estrellaSvg = document.querySelector('.btn-favourites svg');
  if (estrellaSvg) {
    estrellaSvg.style.fill = 'none';
    estrellaSvg.style.stroke = 'currentColor'; // o el color por defecto de tu icono
  }
  const botonAura = document.querySelector('.btn-aura');
  if (botonAura) {
    botonAura.remove();
  }
}

export {
  activarBotonFavoritoIndividual,
  mostrarAlbumesFavoritos,
  resetEstadoFavoritos,
  obtenerFavoritos
}