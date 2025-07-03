// En producción usa: const env = process.env;
const env = {
    DB_USER: 'root',
    DB_PASS: '',
    DB_HOST: 'localhost',
    DB_NAME: 'tickets',
    DB_PORT: 3306,

    MONGO_URL: 'mongodb://localhost:27017/event_ticketing',
    JWT_SECRET: 'EventTicketingSystem2023!'
};

export const key = {
    db: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASS


    },
    mongo: {
        url: env.MONGO_URL,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: '1d'
    },
    encryption: {
        algorithm: 'aes-256-cbc',
        iv: 'EventTicketiv2023' // Debe ser 16 caracteres
    }
};
