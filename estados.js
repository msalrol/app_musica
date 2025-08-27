let albumesFiltrados = [];
let todosLosAlbumes = [];
const urlLocal = 'http://localhost:8080/';
let paginaActual = 0;


export const estado = {
    get todosLosAlbumes(){
        return todosLosAlbumes;
    },
    set todosLosAlbumes(nuevos){
        todosLosAlbumes = nuevos; 
    },
    get albumesFiltrados(){
        return albumesFiltrados;
    },
    set albumesFiltrados(nuevos){
        albumesFiltrados = nuevos;
    },
    get urlLocal(){
        return urlLocal;
    },
    get paginaActual(){
        return paginaActual;
    },
    set paginaActual(nueva){
        paginaActual = nueva;
    }

}