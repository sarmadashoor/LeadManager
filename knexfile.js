require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/infrastructure/persistence/migrations'
    },
    seeds: {
      directory: './src/infrastructure/persistence/seeds'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/infrastructure/persistence/migrations'
    }
  }
};
