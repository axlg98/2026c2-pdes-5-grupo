import {createAgenciaController} from '../../controllers/agenciaController.js';
import test, {describe, beforeEach} from 'node:test';
import assert from 'node:assert/strict';

const createResponse = () => ({
    statusCode:200,
    body: undefined,
    status(code){
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.body = payload;
        return this;
    }
});

const createDatabase = ({agencias = [], paquetes = [], insertResult = [], deleteResult: []} = {}) => {
    let consultas = 0;
    return {
        select() {
            const filas = consultas++ == 0 ? agencias : paquetes;
            return {
                from() {
                    return {
                        where: async () => filas
                    };
                }
            };
        },
        insert() {
            return {
                values: () => ({
                    returning: async () => insertResult
                })
            };
        },
        delete(){
            return {
                where: () => ({
                    returning: async () => deleteResult
                })
            };
        },
    };
};

const agenciaValida = { agencia_id: 1, user_id: 123 };
const bodyPaqueteValido = {
  idUsuario: 123,
  nombre: 'Bariloche',
  destino: 'Bariloche',
  origen: 'Buenos Aires',
  descripcion: 'demo',
  precio: 1000
};

describe('Obtener mis paquetes', () =>{
    test('Devuelve 200 si devuelve los paquetes de la agencia del usuario', async () => {
        const paquetes = [
            { id: 1, nombre: 'Paquete 1', agencia_id: 1 },
            { id: 2, nombre: 'Paquete 2', agencia_id: 1 }
        ];

        const agencias = [{ agencia_id: 1, user_id: 123 }];
        const controller = createAgenciaController(createDatabase({ agencias, paquetes }));
        const req = { query: { idUsuario: 123 } };
        const res = createResponse();

        await controller.obtenerMisPaquetes(req, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, { paquetes });   
    });

    test('Devuelve 403 si el usuario no tiene agencia', async () => {
        const controller = createAgenciaController(createDatabase({ agencias: [], paquetes: [] }));
        const req = { query: { idUsuario: 999 } };
        const res = createResponse();

        await controller.obtenerMisPaquetes(req, res);

        assert.equal(res.statusCode, 403);
    });

    test('Devuelve 500 si la base de datos falla', async () => {
        const database = {
            select() {
                return {
                    from() {
                        return {
                            where: async () => { throw new Error('Conexión perdida'); }
                        };
                    }
                };
            }
        };
        const controller = createAgenciaController(database);
        const req = { query: { idUsuario: 1 } };
        const res = createResponse();

        await controller.obtenerMisPaquetes(req, res);

        assert.equal(res.statusCode, 500);
    });
})

describe('Alta de paquete', () => {

    let res;

    beforeEach(() => {
        res = createResponse();
    });

    test('Devuelve 201 y crea un paquete correctamente', async () => {
        const nuevoPaquete = { id: 1, nombre: 'Bariloche', agencia_id: 1 };
        

        const controller = createAgenciaController(createDatabase({ agencias: [agenciaValida], insertResult: [nuevoPaquete] }));

        await controller.altaPaquete({body: bodyPaqueteValido}, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.paquete.nombre, 'Bariloche')

    })
})

