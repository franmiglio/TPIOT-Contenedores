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
let modoReubicacionActivo = false;
let idContenedorAReubicar = null;

function activarModoReubicacion(id, nombre) {
    modoReubicacionActivo = true;
    idContenedorAReubicar = id;
    map.closePopup();
    document.getElementById('btnActivarMapa').style.display = 'none';
    document.getElementById('textoInstruccion').innerHTML = `Hacé clic en el mapa para reubicar <b>${nombre}</b>... <a href="#" onclick="cancelarModoReubicacion()" style="color: #6c757d; margin-left:10px;">(Cancelar)</a>`;
    document.getElementById('textoInstruccion').style.display = 'inline-block';
    document.getElementById('mapa').style.cursor = 'crosshair';
}

function cancelarModoReubicacion() {
    modoReubicacionActivo = false;
    idContenedorAReubicar = null;
    
    document.getElementById('btnActivarMapa').style.display = 'inline-block';
    document.getElementById('textoInstruccion').innerHTML = `Hacé clic en el mapa para ubicar el contenedor... <a id="cancelarAgregar" href="#" onclick="cancelarModoInsercion()">(Cancelar)</a>`;
    document.getElementById('textoInstruccion').style.display = 'none';
    document.getElementById('mapa').style.cursor = '';
}
map.on('click', async function(e) {
    if (!modoInsercionActivo && !modoReubicacionActivo) return; 

    const lat = Math.round(e.latlng.lat);
    const lng = Math.round(e.latlng.lng); 
    
    if(lat >= 0 && lat <= altoImagen && lng >= 0 && lng <= anchoImagen) {
        
        if (modoInsercionActivo) {
            document.getElementById('contenedorLat').value = lat;
            document.getElementById('contenedorLng').value = lng;
            abrirModalNuevoContenedor();
            cancelarModoInsercion();
            
        } else if (modoReubicacionActivo) {
            try {
                const respuesta = await fetch(`${API_URL}/${idContenedorAReubicar}/ubicacion`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitud: lat, longitud: lng })
                });
                
                if (respuesta.ok) {
                    mostrarMensaje('¡Ubicación actualizada exitosamente!');
                    cargarContenedores();
                }
            } catch (error) { 
                console.error("Error al reubicar:", error); 
            }
            cancelarModoReubicacion();
        }
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
                    <td>
                    <b style="font-size: 15px;">${contenedor.nombre}</b><br>
                    <small style="color: #6c757d;">ID: ${contenedor.id}</small>
                    </td>
                    <td>${contenedor.altura_cm ? contenedor.altura_cm : 'Sin calibrar'}</td>
                    <td><span class="status-badge ${colorClass}">${llenadoTexto}</span></td>
                    <td>${contenedor.piso || '-'}</td>
                    <td><button class="btn btn-action" onclick="abrirModalCalibrar('${contenedor.id}', '${contenedor.nombre}')">Calibrar</button></td>
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
                        <b>${contenedor.nombre}</b><br><br>
                        Nivel actual: <span class="status-badge ${colorClass}">${llenadoTexto}</span><br><br>
                        <button class="btn btn-action" style="margin: 0 auto;"onclick="window.location.href='contenedor.html?id=${contenedor.id}'">Ver Detalles</button>
                        <button id="btn-reubicar"class="btn btn-action" onclick="activarModoReubicacion('${contenedor.id}', '${contenedor.nombre}')"> Mover</button>
                    </div>
                `);

                marcadores.push(marcador);
            }
        });
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}
function abrirModalCalibrar(id, nombre) {
    document.getElementById('nombreContenedorCalibrar').innerText = `"${nombre}"`;
    
    const btnConfirmar = document.getElementById('btnConfirmarCalibrar');
    btnConfirmar.onclick = function() {
        ejecutarCalibracion(id, nombre);
    };
    
    document.getElementById('modalCalibrar').style.display = 'block';
}

function cerrarModalCalibrar() {
    document.getElementById('modalCalibrar').style.display = 'none';
}

async function ejecutarCalibracion(id, nombre) {
    cerrarModalCalibrar();
    
    try {
        const respuesta = await fetch(`${API_URL}/${id}/calibrar`, { method: 'PUT' });
        if (respuesta.ok) {
            mostrarMensaje(`Calibrando "${nombre}"... El próximo dato del sensor definirá la altura.`);
            cargarContenedores();
        }
    } catch (error) {
        console.error("Error al calibrar:", error);
    }
}
cargarContenedores();
setInterval(cargarContenedores, 2500);