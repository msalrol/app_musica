const formHtml = `<div id="login">
<input name="nombre" type="text" id="nombre" placeholder="Tu nombre" />
<input name="apellido" type="text" id="apellido" placeholder="Tu apellido" />
<button id="loginBtn">Iniciar sesión</button>
</div>

<div id="saludo"></div>`

document.addEventListener('usuarioLogeado', (e) =>{
    const datosUsuario = e.detail;

    const divSaludo = document.getElementById('saludo');
    const mensaje = `Bienvenido, ${datosUsuario.nombre} ${datosUsuario.apellido}`;
    divSaludo.insertAdjacentElement("beforeend", mensaje);
})

const form = document.getElementById('login');

form.addEventListener('submit', (e) =>{
    e.preventDefault();
    const datosForm = new FormData(form);
    const nombre = datosForm.get('nombre');
    const apellido = datosForm.get('apellido');
    const usuario = {nombre, apellido};

    const eventoPersonalizado = new CustomEvent('usuarioLogeado', {
       detail: usuario
    });
    document.dispatchEvent(eventoPersonalizado);
})

//INTERSECTION OBSERVER:

const secciones = document.querySelectorAll('secciones');

const observer = new IntersectionObserver((entries) =>{
    entries.forEach((entry) => {
        if(entry.isIntersecting){
            entry.target.classList.add('visible');
        }
    })
}, threshold(0.5))

secciones.forEach(seccion =>{
    observer.observe(seccion);
})