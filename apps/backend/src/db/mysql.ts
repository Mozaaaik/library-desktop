import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '127.0.0.1',               // localhost değil
  user: 'root',
  password: '',                    // sende parola yok (ekranda Hayır)
  database: 'UniversiteKutuphaneDB',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
});
