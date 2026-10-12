process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-pruebas-0123456789';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // rápido en pruebas
