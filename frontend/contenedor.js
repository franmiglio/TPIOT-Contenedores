const API_URL = 'http://localhost:3000/api/contenedores';
const parametrosUrl = new URLSearchParams(window.location.search);
const idContenedor = parametrosUrl.get('id');

const titulo = document.getElementById('tituloContenedor');
const inputNombre = document.getElementById('editNombre');
const selectPiso = document.getElementById('editPiso');
const inputAltura = document.getElementById('editAltura');
const formEditar = document.getElementById('formEditarContenedor');

const statVaciados = document.getElementById('statVaciados');
const statPromedio = document.getElementById('statPromedio');

async function cargarDatosPagina() {
    if (!idContenedor) {
        titulo.innerText = 'Error: No se especificó un contenedor.';
        return;
    }


    try {
        const resDatos = await fetch(`${API_URL}/${idContenedor}`);
        if (resDatos.ok) {
            const datos = await resDatos.json();
            document.getElementById('editTopic').value = datos.topic_mqtt;
            inputNombre.value = datos.nombre;
            selectPiso.value = datos.piso;
            inputAltura.value = datos.altura_cm;
            titulo.innerText = `Gestión de: ${inputNombre.value}`;
        }
        const resStats = await fetch(`${API_URL}/${idContenedor}/estadisticas`);
        if (resStats.ok) {
            const stats = await resStats.json();
    
            if (statPromedio && statVaciados) {
                statVaciados.innerText = `${stats.vaciados} veces en los últimos 7 días`;
                statPromedio.innerText = typeof stats.promedio_horas === 'number' 
                    ? `Aprox. ${stats.promedio_horas} horas` 
                    : stats.promedio_horas;
            }
        }
    } catch (error) {
        console.error("Error al cargar la información:", error);
    }
}

formEditar.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const datosActualizados = {
        nombre: inputNombre.value,
        piso: selectPiso.value,
        altura_cm: inputAltura.value
    };

    try {
        const respuesta = await fetch(`${API_URL}/${idContenedor}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (respuesta.ok) {
            mostrarModalMensaje('¡Actualización Exitosa!', 'Los datos del contenedor se guardaron correctamente.');
        } else {
            mostrarModalMensaje('Error al Guardar', 'Hubo un problema en el servidor al intentar guardar los cambios.', true);
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarModalMensaje('Error de Conexión', 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', true);
    }
});

function mostrarModalMensaje(titulo, texto, esError = false) {
    const modal = document.getElementById('modalMensaje');
    const tituloEl = document.getElementById('modalMensajeTitulo');
    const textoEl = document.getElementById('modalMensajeTexto');
    const btn = document.getElementById('btnAceptarMensaje');

    tituloEl.innerText = titulo;
    textoEl.innerText = texto;

    if (esError) {
        tituloEl.style.color = '#dc3545';
        btn.style.background = '#dc3545';
    } else {
        tituloEl.style.color = '#28a745';
        btn.style.background = '#28a745';
    }

    modal.style.display = 'block';
}

function cerrarModalMensaje() {
    document.getElementById('modalMensaje').style.display = 'none';
    cargarDatosPagina();
}

function abrirModalEliminar() {
    document.getElementById('modalEliminar').style.display = 'block';
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').style.display = 'none';
}

async function ejecutarEliminacion() {
    cerrarModalEliminar();
    
    try {
        const respuesta = await fetch(`${API_URL}/${idContenedor}/desactivar`, { 
            method: 'PUT' 
        });
        
        if (respuesta.ok) {
            mostrarModalMensaje('¡Contenedor Eliminado!', 'El contenedor fue desactivado exitosamente.');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2500);
        } else {
            mostrarModalMensaje('Error', 'Hubo un problema al intentar eliminar el contenedor.', true);
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarModalMensaje('Error de Conexión', 'No se pudo conectar con el servidor.', true);
    }
}
cargarDatosPagina();