# Ethereum Watcher - An Ethereum monitoring and parsing to MySQL.

## Features
- Parse Ethereum only new operation e.g. Ether transfer, token transfer and block creation.
- Import to MySql database.

## Getting start
- Import database schema to your MySql database.
```bash
mysql -u root -p < schema.sql
```
- Import popular tokens from "tokens.sql".
```bash
mysql -u root -p ethereum < tokens.sql
```
- Change MySql username/password in watcher.js and run the watcher program using:
```bash
npm start
```
