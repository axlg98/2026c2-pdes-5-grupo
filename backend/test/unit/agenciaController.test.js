import {createAgenciaController} from '../../controllers/agenciaController.js';
import test, {describe, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import { agencia, hoteles } from '../../db/schema.js';

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

const createDatabase = ({
  agencias = [],
  hoteles: hotelesResult = [],
  paquetes = [],
  insertResult = [],
  deleteResult = []
} = {}) => {
    let consultas = 0;
    return {
        select() {
            const filas = consultas++ == 0 ? agencias : paquetes;
            return {
                from(table) {
                    return {
                                where: async () => table === agencia
                                  ? agencias
                                  : table === hoteles
                                    ? hotelesResult
                                    : paquetes
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
  precio: 1000,
  hotel_id: 1,
  vuelo_ida_id: 10,
  vuelo_vuelta_id: 11,
  fecha_ida: '2027-01-15',
  fecha_vuelta: '2027-01-22'
};

const flightApiClientValido = {
  getFlight: async (id) => id === 10 ? {
    id: 10,
    origen: 'Buenos Aires',
    destino: 'Bariloche',
    fecha: '2027-01-15',
    disponibilidad: 100
  } : {
    id: 11,
    origen: 'Bariloche',
    destino: 'Buenos Aires',
    fecha: '2027-01-22',
    disponibilidad: 100
  }
};

describe('Obtener mis paquetes', () =>{
    test('Devuelve 200 si devuelve los paquetes de la agencia del usuario', async () => {
        const paquetes = [
            { id: 1, nombre: 'Paquete 1', agencia_id: 1 },
            { id: 2, nombre: 'Paquete 2', agencia_id: 1 }
        ];

        const agencias = [{ agencia_id: 1, user_id: 123 }];
        const controller = createAgenciaController(createDatabase({ agencias, paquetes }));
        const req = { query: { idUsuario: 123 }, user: { id: 123 } };
        const res = createResponse();

        await controller.obtenerMisPaquetes(req, res);

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, { paquetes });   
    });

    test('Devuelve 403 si el usuario no tiene agencia', async () => {
        const controller = createAgenciaController(createDatabase({ agencias: [], paquetes: [] }));
        const req = { query: { idUsuario: 999 }, user: { id: 999 } };
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
        const req = { query: { idUsuario: 1 }, user: { id: 1 } };
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
        

        const controller = createAgenciaController(
          createDatabase({
            agencias: [agenciaValida],
            hoteles: [{ id: 1, nombre: 'Hotel Demo', destino: 'Bariloche' }],
            insertResult: [nuevoPaquete]
          }),
          { flightApiClient: flightApiClientValido }
        );

        await controller.altaPaquete({ body: bodyPaqueteValido, user: { id: 123 } }, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.paquete.nombre, 'Bariloche')
    })

    test('rechaza cuando el hotel no pertenece al destino', async () => {
      const controller = createAgenciaController(
        createDatabase({
          agencias: [agenciaValida],
          hoteles: [{ id: 1, nombre: 'Hotel Demo', destino: 'Mendoza' }]
        }),
        { flightApiClient: flightApiClientValido }
      );

      await controller.altaPaquete({ body: bodyPaqueteValido, user: { id: 123 } }, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'El hotel debe pertenecer al destino del paquete.');
    });

    test('rechaza cuando el vuelo de ida no coincide con el paquete', async () => {
      const controller = createAgenciaController(
        createDatabase({
          agencias: [agenciaValida],
          hoteles: [{ id: 1, nombre: 'Hotel Demo', destino: 'Bariloche' }]
        }),
        {
          flightApiClient: {
            getFlight: async (id) => id === 10 ? {
              id: 10,
              origen: 'Cordoba',
              destino: 'Bariloche',
              fecha: '2027-01-15',
              disponibilidad: 100
            } : flightApiClientValido.getFlight(id)
          }
        }
      );

      await controller.altaPaquete({ body: bodyPaqueteValido, user: { id: 123 } }, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /vuelo de ida/);
    });

    test('rechaza vuelos sin disponibilidad', async () => {
      const controller = createAgenciaController(
        createDatabase({
          agencias: [agenciaValida],
          hoteles: [{ id: 1, nombre: 'Hotel Demo', destino: 'Bariloche' }]
        }),
        {
          flightApiClient: {
            getFlight: async (id) => ({
              id,
              origen: id === 10 ? 'Buenos Aires' : 'Bariloche',
              destino: id === 10 ? 'Bariloche' : 'Buenos Aires',
              fecha: id === 10 ? '2027-01-15' : '2027-01-22',
              disponibilidad: 0
            })
          }
        }
      );

      await controller.altaPaquete({ body: bodyPaqueteValido, user: { id: 123 } }, res);

      assert.equal(res.statusCode, 409);
      assert.match(res.body.error, /disponibilidad/);
    });
})
