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

    titulo.innerText = `Gestión de: ${idContenedor}`;

    try {
        const resDatos = await fetch(`${API_URL}/${idContenedor}`);
        if (resDatos.ok) {
            const datos = await resDatos.json();
            inputNombre.value = datos.nombre;
            selectPiso.value = datos.piso;
            inputAltura.value = datos.altura_cm;
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
            alert('¡Datos actualizados exitosamente!');
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert('Hubo un error al guardar los cambios.');
    }
});

cargarDatosPagina();