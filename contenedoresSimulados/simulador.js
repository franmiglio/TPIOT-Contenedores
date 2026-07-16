const mqtt = require('mqtt');

const cliente = mqtt.connect('mqtt://localhost:1883');

const tachos = [
    { id: 'contenedor2', distanciaActual: 80, alturaMaxima: 90 },
    { id: 'contenedores_3', distanciaActual: 60, alturaMaxima: 90 },
    { id: 'contenedor_p2_1', distanciaActual: 30, alturaMaxima: 90 }
];

cliente.on('connect', () => {
    console.log('Simulador conectado al broker MQTT');
    console.log('Comenzando a enviar telemetría...\n');

    setInterval(() => {
        tachos.forEach(tacho => {
            const basuraTirada = Math.floor(Math.random() * 6);
            tacho.distanciaActual -= basuraTirada;

            if (tacho.distanciaActual < 5) {
                tacho.distanciaActual = tacho.alturaMaxima;
                console.log(`El contenedor ${tacho.id} fue vaciado.`);
            }

            const topic = `facultad/contenedores/${tacho.id}`;
            cliente.publish(topic, tacho.distanciaActual.toString());
            
            console.log(`Enviado -> ${topic}: ${tacho.distanciaActual} cm`);
        });
    }, 4000); 
});

cliente.on('error', (error) => {
    console.error('Error de conexión MQTT:', error);
});