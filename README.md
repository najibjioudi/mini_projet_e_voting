# 🗳️ E-Voting Platform

A secure and scalable electronic voting system built with **Spring Boot microservices** and a **React** frontend. This platform enables organizations to conduct elections digitally with features like voter registration, identity verification via OCR, and real-time result computation.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.4-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2023.0.1-purple)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Microservices](#microservices)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [API Gateway Routes](#api-gateway-routes)
- [Configuration](#configuration)
- [Technologies Used](#technologies-used)

---

## 🏗️ Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Frontend      │
                                    │   (React)       │
                                    │   Port: 5173    │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  API Gateway    │
                                    │   Port: 8888    │
                                    └────────┬────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                   │               │               │                   │
         ▼                   ▼               ▼               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │ Election Service│ │  Voter Service  │ │  Vote Service   │ │ Result Service  │
│   Port: 8085    │ │   Port: 8082    │ │   Port: 8081    │ │   Port: 8083    │ │   Port: 8084    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │               │               │                   │
         ▼                   ▼               ▼               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Admin Service  │ │ Elector Service │ │   OCR Service   │ │ Config Server   │ │Discovery Service│
│   Port: 8086    │ │   Port: 8087    │ │   Port: 8090    │ │   Port: 8888    │ │   Port: 8761    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🔧 Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Discovery Service** | 8761 | Netflix Eureka server for service registration and discovery |
| **Config Server** | 8888 | Centralized configuration management using Spring Cloud Config |
| **Gateway Service** | 8888 | API Gateway with JWT authentication and route management |
| **Auth Service** | 8085 | Handles user authentication, registration, and JWT token management |
| **Admin Service** | 8086 | Administrative operations and user management |
| **Voter Service** | 8081 | Manages voter information and eligibility |
| **Election Service** | 8082 | Creates and manages elections and candidates |
| **Elector Service** | 8087 | Manages electoral candidates and their profiles |
| **Vote Service** | 8083 | Processes and stores votes securely |
| **Result Service** | 8084 | Computes and publishes election results |
| **OCR Service** | 8090 | Identity document verification using Tesseract OCR |
| **Frontend** | 5173 | React-based user interface |

---

## 📦 Prerequisites

Before running this project, ensure you have the following installed:

- **Java 17** or higher
- **Maven 3.8+**
- **Node.js 18+** and **npm**
- **MySQL** (or configured database)
- **Tesseract OCR** (for OCR service)

### Installing Tesseract OCR

**Windows:**
```bash
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH after installation
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/najibjioudi/mini_projet_e_voting.git
cd mini_projet_e_voting
```

### 2. Configure Databases

Each service uses its own database. Update the configuration files in `config-repo/` to match your database settings:

```yaml
# Example: config-repo/voter-service.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/voter_db
    username: your_username
    password: your_password
```

### 3. Create Required Databases

```sql
CREATE DATABASE auth_db;
CREATE DATABASE voter_db;
CREATE DATABASE election_db;
CREATE DATABASE elector_db;
CREATE DATABASE vote_db;
CREATE DATABASE result_db;
CREATE DATABASE admin_db;
```

---

## ▶️ Running the Application

### Start Services in Order

**⚠️ Important:** Services must be started in the following order for proper registration.

#### Step 1: Start Discovery Service (Eureka)
```bash
cd discovery-service
mvn spring-boot:run
```
Wait until you see: `Started DiscoveryServiceApplication`

Access Eureka Dashboard: http://localhost:8761

#### Step 2: Start Config Server
```bash
cd config-server
mvn spring-boot:run
```

#### Step 3: Start Gateway Service
```bash
cd gateway-service
mvn spring-boot:run
```

#### Step 4: Start Business Services (can be started in parallel)

Open separate terminals for each:

```bash
# Terminal 1 - Auth Service
cd auth-service
mvn spring-boot:run

# Terminal 2 - Voter Service
cd voter-service
mvn spring-boot:run

# Terminal 3 - Election Service
cd election-service
mvn spring-boot:run

# Terminal 4 - Elector Service
cd elector-service
mvn spring-boot:run

# Terminal 5 - Vote Service
cd vote-service
mvn spring-boot:run

# Terminal 6 - Result Service
cd result-service
mvn spring-boot:run

# Terminal 7 - Admin Service
cd admin-service
mvn spring-boot:run

# Terminal 8 - OCR Service
cd ocr-service
mvn spring-boot:run
```

#### Step 5: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Access the application: http://localhost:5173

---

## 🛣️ API Gateway Routes

All API requests go through the Gateway Service at `http://localhost:8888`:

| Route | Service | Description |
|-------|---------|-------------|
| `/api/auth/**` | Auth Service | Authentication endpoints |
| `/api/voters/**` | Voter Service | Voter management |
| `/api/elections/**` | Election Service | Election management |
| `/api/electors/**` | Elector Service | Candidate management |
| `/api/votes/**` | Vote Service | Voting operations |
| `/api/results/**` | Result Service | Election results |
| `/api/admin/**` | Admin Service | Admin operations |
| `/api/ocr/**` | OCR Service | Identity verification |

---

## ⚙️ Configuration

### JWT Configuration

JWT settings are defined in `config-repo/application.yml`:

```yaml
jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration: 3600000 # 1 hour
  refresh-expiration: 86400000 # 24 hours
```

### Service Ports Reference

| Service | Default Port |
|---------|--------------|
| Discovery Service | 8761 |
| Config Server | 8888 |
| Gateway Service | 8888 |
| Voter Service | 8081 |
| Election Service | 8082 |
| Vote Service | 8083 |
| Result Service | 8084 |
| Auth Service | 8085 |
| Admin Service | 8086 |
| Elector Service | 8087 |
| OCR Service | 8090 |
| Frontend | 5173 |

---

## 🛠️ Technologies Used

### Backend
- **Java 17**
- **Spring Boot 3.2.4**
- **Spring Cloud 2023.0.1**
  - Netflix Eureka (Service Discovery)
  - Spring Cloud Config (Configuration Management)
  - Spring Cloud Gateway (API Gateway)
- **Spring Security** with JWT
- **Spring Data JPA**
- **MySQL**
- **Tesseract OCR** (Tess4J)

### Frontend
- **React 18.2**
- **React Router 7**
- **Vite**
- **TailwindCSS**
- **Recharts** (for data visualization)
- **TypeScript**

---

## 📁 Project Structure

```
e_voting_v2/
├── admin-service/          # Administrative operations
├── auth-service/           # Authentication & authorization
├── config-repo/            # Configuration files for all services
├── config-server/          # Spring Cloud Config Server
├── discovery-service/      # Netflix Eureka Server
├── election-service/       # Election management
├── elector-service/        # Candidate management
├── frontend/               # React frontend application
├── gateway-service/        # API Gateway
├── ocr-service/            # OCR identity verification
├── result-service/         # Election results computation
├── Tess4J/                 # Tesseract OCR library
├── uploads/                # File uploads directory
├── vote-service/           # Voting operations
└── voter-service/          # Voter management
```

---

## 🔐 Security Features

- **JWT-based authentication** for stateless security
- **Role-based access control** (Admin, Voter)
- **OCR verification** for identity documents
- **Secure vote storage** with voter anonymity
- **API Gateway** filtering and security

---

## 📝 License

This project is developed for educational purposes as part of a mini-project.

---

## 👤 Author

**Najib Jioudi**

- GitHub: [@najibjioudi](https://github.com/najibjioudi)
