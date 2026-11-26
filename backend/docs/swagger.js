import swaggerJsdoc from 'swagger-jsdoc'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Compra tu Viaje API',
            version: '1.0.0',
            description: 'API para Compra tu Viaje',
            
        }
    },
    apis: ['./docs/*.yml']
};

const specs = swaggerJsdoc(options);
export default specs;