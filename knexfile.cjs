
module.exports = {
  development: {
    client: "pg",
    connection: "postgresql://danvin:pass@34.198.2.14:5432/postgres",
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};


//   production: {
//     client: "pg",
//     connection: process.env.DATABASE_URL, 
//     migrations: {
//       directory: "../migrations",
//       extension: "js"
//     },
//     seeds: {
//       directory: "./seeds"
//     }
//   }
// };
