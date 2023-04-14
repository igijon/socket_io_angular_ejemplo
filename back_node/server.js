/**
 * Declaramos los paquetes a utilizar
 */
// const express = require('express');
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import chalk from 'chalk';

const app = express();

const server = http.Server(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

/**
 * ----- API REST ------
 * En esta parte hacemos que cuando visiten http://localhost:3000/ retorne una pagina con "Hello World"
 */

app.get('/', function (req, res) { 
    res.send('Hello World!');
});

/**
 * Fin API REST
 */

/**
 * -----------------------------------------------------
 * Socket.io conexion
 * ----------------------------------------------------
 */

io.on('connection', function (socket) {

    /** handshake: Es el id de conexion con el dispositivo cliente */
    const id_handshake = socket.id;

    /** query: En este ejemplo practico queremos enviar una información extra en la conexión
     * acerca del usuario que esta logeado en el Front. Para ello lo enviamos dentro de un objeto por defecto llamado "query"
     */
    let {payload} = socket.handshake.query;

    
    console.log(`${chalk.blue(`Nuevo dispositivo conectado: ${id_handshake}`)}`);

    if (!payload) {

        console.log(`${chalk.red(`Sin payload`)}`);
    
    } else {
        payload = JSON.parse(payload)
    
        /**
         * Una vez enviado la informacion del usuario conectado en este caso es un peequeño objecto que contiene nombre y id,
         * creamos una sala y lo unimos https://socket.io/docs/rooms-and-namespaces/
         */
        socket.join(`room_${payload.id}`);

        console.log(`${chalk.yellow(`El dispositivo ${id_handshake} se unio a -> ${`room_${payload.id}`}`)}`);

        /**
         * --------- EMITIR -------------
         * Para probar la conexion con el dispositivo unico le emitimos un mensaje a el dispositivo conectado
         */
        socket.emit('message', {
            msg: `Hola tu eres el dispositivo ${id_handshake}, perteneces a la sala room_${payload.id}, de ${payload.user}`
        });

        /**
         * ----------- ESCUCHAR -------------
         * Cuando el cliente nos emite un mensaje la api los escucha de la siguiente manera
         */
        socket.on('default', function(res){

            switch (res.event) {
                case 'message':
                    /**
                     * Si el evento que escucha es "message", se parsea la informacion recibida
                     * y posteriormente se emite un "message" a todos los dispositivos unidos a la sala.
                     */
                    const inPayloadCookie = JSON.parse(res.cookiePayload);
                    const inPayload = res.payload;

                    io.to(`room_${inPayloadCookie.id}`).emit('message',{
                        msg: `Sala room__${inPayloadCookie.id} de ${inPayloadCookie.user}: ${inPayload.message}`
                    });

                    break;
                default:
                    /** Otros posibles casos */
                    break;
            }

        });
    };

    /**
     * Si un dispositivo se desconecto lo detectamos aqui
     */
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

server.listen(5001, function () {
    console.log('\n')
    console.log(`>> Socket listo y escuchando por el puerto: ${chalk.green('5001')}`)
})

app.listen(3000, function () {
    console.log(`>> Express listo y escuchando por el puerto: ${chalk.green('3000')}`)
    console.log('\n')
});