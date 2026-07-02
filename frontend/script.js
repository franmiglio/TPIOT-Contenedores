    const API_URL = 'http://localhost:3000/api/contenedores';

    function abrirModalNuevoContenedor() {
        document.getElementById('modalContenedor').style.display = 'block';
    }

    function cerrarModal() {
        document.getElementById('modalContenedor').style.display = 'none';
        document.getElementById('formNuevoContenedor').reset(); 
    }

    function mostrarMensaje(texto) {
        const msg = document.getElementById('mensaje-flotante');
        msg.innerText = texto;
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }

    async function guardarContenedor(event) {
        event.preventDefault(); 
        
        const nuevoContenedor = {
            id: document.getElementById('contenedorId').value,
            nombre: document.getElementById('contenedorNombre').value,
            altura_cm: document.getElementById('contenedorAltura').value || null,
            latitud: document.getElementById('contenedorLat').value || null,
            longitud: document.getElementById('contenedorLng').value || null
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
            } else {
                mostrarMensaje('Error al guardar en la base de datos.');
            }
        } catch (error) {
            console.error("Error en la petición POST:", error);
        }
    }

    async function cargarContenedores() {
        try {
            const respuesta = await fetch(API_URL + '/estado');
            const contenedores = await respuesta.json();
            
            const tbody = document.getElementById('tabla-contenedores');
            tbody.innerHTML = ''; 

            contenedores.forEach(contenedor => {
                let colorClass = 'bg-success';
                let llenadoTexto = contenedor.porcentaje + '%';

                if(contenedor.porcentaje > 70) colorClass = 'bg-warning';
                if(contenedor.porcentaje > 90) colorClass = 'bg-danger';
                
                // Si la altura es nula, significa que está esperando calibración
                if(contenedor.altura_cm === null) {
                    colorClass = 'bg-secondary';
                    llenadoTexto = 'Pendiente';
                }

                const fila = `
                    <tr>
                        <td>${contenedor.id}</td>
                        <td>${contenedor.nombre}</td>
                        <td>${contenedor.altura_cm ? contenedor.altura_cm : 'Sin calibrar'}</td>
                        <td><span class="status-badge ${colorClass}">${llenadoTexto}</span></td>
                        <td>
                            <button class="btn" style="background:#17a2b8;" onclick="console.log('Calibrar: ${contenedor.id}')">Calibrar</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        } catch (error) {
            console.error("Error al cargar los datos:", error);
        }
    }

    cargarContenedores();
    setInterval(cargarContenedores, 5000);