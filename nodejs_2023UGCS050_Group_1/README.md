# PF Lab Project Web App

## Members
* Apoorva Singh - 2023UGCS025
* Mihir Kumar - 2023UGCS049
* Asim Kumar Mahata - 2023UGCS050
* Aditya Raj - 2023UGCS051

## To Run Webapp 
```bash
docker compose up --build
```

## To Stop Webapp 
```bash
docker compose down
```

## About

This is a vault web application. It lets users securely store and manage passwords, credentials, and documents in one place.

Users can create vaults to organize their data. Each vault can hold login credentials (username, password, URL) and uploaded documents (images and PDFs). All data is tied to a user account and is only accessible after logging in.

### Features

- User registration and login with JWT-based authentication
- Create and manage vaults with a name, description, and color
- Store credentials with a title, username, password, URL, and notes
- Upload and manage documents per vault
- Built with Node.js, Express, MySQL, and React

