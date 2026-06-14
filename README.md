
# Government Citizen Review System

This is a code bundle for Government Citizen Review System. The original project is available at https://www.figma.com/design/hwaGwtjrDFaI8k4kKd6HA6/Government-Citizen-Review-System.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the frontend development server.

Run the automated test cases:

```powershell
npm test
```

## MySQL backend

1. Create a `.env` file from `.env.example` and update the MySQL username/password.
2. Make sure MySQL is running.
3. Initialize the database and tables:

```powershell
npm run db:init
```

4. Check the database connection:

```powershell
npm run db:check
```

5. Start the API server:

```powershell
npm run api
```

6. In another terminal, start the frontend:

```powershell
npm run dev
```

The frontend uses `VITE_API_BASE_URL` from `.env`. If the API is unavailable, the app keeps working in demo mode with browser localStorage.
