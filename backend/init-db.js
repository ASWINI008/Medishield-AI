import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const init = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    
    const dbName = process.env.DB_NAME || 'medishield';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' created or already exists.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create database. Please check your MySQL credentials in .env');
    console.error(err.message);
    process.exit(1);
  }
};

init();
