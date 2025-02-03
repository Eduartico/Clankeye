import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Clankeye API',
        description: 'API documentation for OLX and Vinted offers',
    },
    host: 'localhost:4000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
    './routes/olxRoutes.js', 
    './routes/vintedRoutes.js'
];

swaggerAutogen()(outputFile, endpointsFiles, doc);
