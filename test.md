# 🧪 Guia Prático de Testes Manuais — Autenticação (AuthModule)

Este documento descreve o passo a passo para testar manualmente todos os critérios de aceitação do endpoint `POST /auth/login` e da rota protegida `GET /auth/me`.

---

## 📍 Onde abrir os Terminais do PowerShell?

Você precisará de **dois terminais** abertos simultaneamente no seu computador:

### 🔹 Terminal 1 (Servidor & Banco de Dados)
* **Diretório onde deve estar aberto:**  
  `C:\Users\lucas\Documents\Facul\Ciencias da Computação\2026-2\Projeto Integração\arthemis\apps\api`
* **Função deste terminal:** Manter a API NestJS rodando e exibindo os logs das requisições em tempo real.

---

### 🔹 Terminal 2 (Cliente / Disparador dos Testes)
* **Diretório onde deve estar aberto:**  
  Pode ser em **qualquer pasta** (por exemplo, na raiz do projeto `arthemis` ou na sua pasta de usuário).
* **Função deste terminal:** Executar os comandos do PowerShell (`Invoke-RestMethod`) para enviar as requisições HTTP para a API.

---

## 🚀 1. Preparação Inicial do Ambiente (Faça isso primeiro)

### Passo 1.1: Garantir que o banco de dados no Docker está ativo
Abra um terminal na pasta raiz do repositório `arthemis` e execute:
```powershell
cd "C:\Users\lucas\Documents\Facul\Ciencias da Computação\2026-2\Projeto Integração\arthemis"
docker compose up -d
```
> *(Isso garante que o container `arthemis-postgres` esteja rodando na porta 5433).*

### Passo 1.2: Popular o banco com o usuário de teste (se ainda não o fez)
No mesmo terminal ou na pasta `apps/api`:
```powershell
cd "C:\Users\lucas\Documents\Facul\Ciencias da Computação\2026-2\Projeto Integração\arthemis\apps\api"
node prisma/seed.js
```
> **Credenciais criadas no seed:**
> * **E-mail:** `admin@arthemis.com`
> * **Senha:** `senha123`

### Passo 1.3: Iniciar o Servidor NestJS (No Terminal 1)
No **Terminal 1**, navegue até `apps/api` e ligue a aplicação:
```powershell
cd "C:\Users\lucas\Documents\Facul\Ciencias da Computação\2026-2\Projeto Integração\arthemis\apps\api"
npm run start:dev
```
> ⏳ **Atenção:** Deixe o **Terminal 1** aberto e rodando! Ele deve mostrar que a aplicação foi iniciada na porta 3000.

---

## 🔬 2. Executando os Testes (No Terminal 2)

Agora vá para o **Terminal 2** e execute os blocos de comando abaixo para cada cenário:

---

### ✅ Cenário 1: Login com Credenciais Corretas (Critério: Status 200 + Token JWT)

```powershell
$corpo = @{ email = "admin@arthemis.com"; password = "senha123" } | ConvertTo-Json
$resposta = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body $corpo
$resposta | ConvertTo-Json
```

* **Resultado esperado no terminal:**  
  Retorna **Status 200 (OK)** com o token JWT e os dados do usuário:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-do-usuario",
      "email": "admin@arthemis.com",
      "username": "admin",
      "role": "admin",
      "proponentId": 1
    }
  }
  ```

---

### ❌ Cenário 2: Senha Incorreta (Critério: Status 401 Unauthorized)

```powershell
$corpo = @{ email = "admin@arthemis.com"; password = "senha_completamente_errada" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body $corpo
```

* **Resultado esperado no terminal:**  
  Retorna erro **Status 401 (Unauthorized)**:
  ```json
  {
    "message": "Credenciais inválidas: e-mail ou senha incorretos.",
    "error": "Unauthorized",
    "statusCode": 401
  }
  ```

---

### ❌ Cenário 3: E-mail Não Cadastrado (Critério: Status 401)

```powershell
$corpo = @{ email = "usuario_fantasma@arthemis.com"; password = "senha123" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body $corpo
```

* **Resultado esperado no terminal:**  
  Retorna erro **Status 401 (Unauthorized)**:
  ```json
  {
    "message": "Credenciais inválidas: e-mail ou senha incorretos.",
    "error": "Unauthorized",
    "statusCode": 401
  }
  ```

---

### ❌ Cenário 4: Formato Inválido / Sem E-mail (Critério: Status 400 Bad Request)

```powershell
# Enviando apenas a senha, sem o campo 'email'
$corpo = @{ password = "senha123" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body $corpo
```

* **Resultado esperado no terminal:**  
  Barrado pelo DTO com **Status 400 (Bad Request)**:
  ```json
  {
    "message": [
      "O e-mail informado deve ser um endereço válido.",
      "O e-mail é obrigatório."
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```

---

### 🔒 Cenário 5: Rota Protegida `GET /auth/me`

#### 5.1 — Acesso com Token JWT Válido (Status 200):
```powershell
# Faz login e captura o token na variável $token
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -ContentType "application/json" -Body (@{ email = "admin@arthemis.com"; password = "senha123" } | ConvertTo-Json)
$token = $login.access_token

# Faz a requisição GET enviando o token no header Authorization
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me" -Headers @{ Authorization = "Bearer $token" }
```
* **Resultado esperado:** Retorna **Status 200 (OK)** com os dados decodificados do token (`sub`, `email`, `role`, `proponentId`, `exp`).

#### 5.2 — Tentativa de Acesso sem Token (Status 401):
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me"
```
* **Resultado esperado:** Retorna erro **Status 401 (Unauthorized)**:
  ```json
  {
    "message": "Acesso não autorizado: token JWT ausente.",
    "error": "Unauthorized",
    "statusCode": 401
  }
  ```

---

## ⚡ Execução de Testes Automatizados

Caso queira rodar todos os testes de uma só vez via Vitest:
```powershell
cd "C:\Users\lucas\Documents\Facul\Ciencias da Computação\2026-2\Projeto Integração\arthemis\apps\api"
npm run test:e2e
```
