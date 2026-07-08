const API_URL = 'http://localhost:3000/api/contenedores';

const map = L.map('mapa', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 3
});

let marcadores = [];

const altoImagen = 428;
const anchoImagen = 886;

const limites = [[0, 0], [altoImagen, anchoImagen]];


L.imageOverlay('mapa_facu.png', limites).addTo(map);
map.fitBounds(limites);

map.setMaxBounds([[-200, -200], [altoImagen + 200, anchoImagen + 200]]);

let modoInsercionActivo = false;

function activarModoInsercion() {
    modoInsercionActivo = true;
    
    document.getElementById('btnActivarMapa').style.display = 'none';
    document.getElementById('textoInstruccion').style.display = 'inline-block';
    document.getElementById('mapa').style.cursor = 'crosshair';
}

function cancelarModoInsercion() {
    modoInsercionActivo = false;
    
    document.getElementById('btnActivarMapa').style.display = 'inline-block';
    document.getElementById('textoInstruccion').style.display = 'none';
    document.getElementById('mapa').style.cursor = '';
}

map.on('click', function(e) {
if (!modoInsercionActivo) return; 

    const lat = Math.round(e.latlng.lat);
    const lng = Math.round(e.latlng.lng); 
    
    if(lat >= 0 && lat <= altoImagen && lng >= 0 && lng <= anchoImagen) {
        
        document.getElementById('contenedorLat').value = lat;
        document.getElementById('contenedorLng').value = lng;
        
        abrirModalNuevoContenedor();
        
        cancelarModoInsercion();
        
    }
});


function abrirModalNuevoContenedor() { document.getElementById('modalContenedor').style.display = 'block'; }
function cerrarModal() { 
    document.getElementById('modalContenedor').style.display = 'none'; 
    document.getElementById('formNuevoContenedor').reset(); 
}
function mostrarMensaje(texto) {
    const msg = document.getElementById('mensaje-flotante');
    msg.innerText = texto; msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

async function guardarContenedor(event) {
    event.preventDefault();
    const nuevoContenedor = {
        id: document.getElementById('contenedorId').value,
        nombre: document.getElementById('contenedorNombre').value,
        altura_cm: document.getElementById('contenedorAltura').value || null,
        latitud: document.getElementById('contenedorLat').value || null,
        longitud: document.getElementById('contenedorLng').value || null,
        piso: document.getElementById('contenedorPiso').value
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoContenedor)
        });
        if (respuesta.ok) {
            cerrarModal();
            mostrarMensaje('¡Contenedor agregado exitosamente!');
            cargarContenedores(); 
        }
    } catch (error) { console.error("Error:", error); }
}



async function cargarContenedores() {
    try {
        const respuesta = await fetch(API_URL + '/estado');
        let contenedores = await respuesta.json();
        

        const pisoSeleccionado = document.getElementById('filtroPiso').value;
        
        if (pisoSeleccionado !== 'Todos') {
         
            contenedores = contenedores.filter(c => c.piso === pisoSeleccionado);
        }

        const tbody = document.getElementById('tabla-contenedores');
        tbody.innerHTML = ''; 

        marcadores.forEach(m => map.removeLayer(m));
        marcadores = [];

        contenedores.forEach(contenedor => {
            let colorClass = 'bg-success';
            let colorMapa = '#28a745'; 
            let llenadoTexto = contenedor.porcentaje + '%';

            if(contenedor.porcentaje > 70) {
                colorClass = 'bg-warning';
                colorMapa = '#ffc107';
            }
            if(contenedor.porcentaje > 90) {
                colorClass = 'bg-danger';
                colorMapa = '#dc3545';
            }
            if(contenedor.altura_cm === null) {
                colorClass = 'bg-secondary';
                colorMapa = '#6c757d'; 
                llenadoTexto = 'Pendiente';
            }

            const fila = `
                <tr>
                    <td>${contenedor.id}</td>
                    <td>${contenedor.nombre}</td>
                    <td>${contenedor.altura_cm ? contenedor.altura_cm : 'Sin calibrar'}</td>
                    <td><span class="status-badge ${colorClass}">${llenadoTexto}</span></td>
                    <td>${contenedor.piso || '-'}</td>
                    <td><button class="btn" style="background:#17a2b8;" onclick="calibrarContenedor('${contenedor.id}')">Calibrar</button></td>
                </tr>
            `;
            tbody.innerHTML += fila;

           
            if(contenedor.latitud && contenedor.longitud) {
                const lat = parseFloat(contenedor.latitud);
                const lng = parseFloat(contenedor.longitud);

                let fondoDinamico = `linear-gradient(to top, ${colorMapa} ${contenedor.porcentaje}%, white ${contenedor.porcentaje}%)`;
                if(contenedor.altura_cm === null) fondoDinamico = '#e0e0e0';

                const iconoTacho = L.divIcon({
                    className: 'icono-transparente', 
                    html: `<div class="marcador-tacho" style="background: ${fondoDinamico};"></div>`,
                    iconSize: [16, 22], 
                    iconAnchor: [10, 22], 
                    popupAnchor: [0, -22] 
                });

                const marcador = L.marker([lat, lng], { icon: iconoTacho }).addTo(map);

                marcador.bindPopup(`
                    <div style="text-align: center;">
                        <b style="font-size: 14px;">${contenedor.nombre}</b><br><br>
                        Nivel actual: <span class="status-badge ${colorClass}">${llenadoTexto}</span><br><br>
                        <a href="contenedor.html?id=${contenedor.id}" class="btn" style="background-color: #007bff; text-decoration: none; display: block; color: white;">Ver Detalles</a>
                    </div>
                `);

                marcadores.push(marcador);
            }
        });
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}
async function calibrarContenedor(id) {
    if(!confirm(`Asegurate de que el contenedor ${id} esté VACÍO. ¿Comenzar calibración?`)) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}/calibrar`, { method: 'PUT' });
        if (respuesta.ok) {
            mostrarMensaje(`Calibrando ${id}... El próximo dato del sensor definirá la altura.`);
            cargarContenedores();
        }
    } catch (error) {
        console.error("Error al calibrar:", error);
    }
}
cargarContenedores();
setInterval(cargarContenedores, 2500);