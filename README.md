# Access Request Management System

A full-stack web application for managing access requests with a modern card-based admin dashboard.

## Project Structure

```
├── client/          # React frontend application
├── server/          # Node.js/Express backend API
├── package.json     # Root package.json for development scripts
└── README.md        # This file
```

## Features

- **Admin Dashboard**: Modern card-based interface for managing requests
- **HR Dashboard**: Specialized interface for HR operations
- **User Authentication**: Secure login system with JWT tokens
- **Request Management**: Create, view, and manage access requests
- **File Upload**: Support for document attachments
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd access-request-management
```

2. Install dependencies for both client and server:
```bash
npm run install-all
```

3. Set up environment variables:
   - Create `.env` file in the `server/` directory
   - Add your MongoDB connection string and other required variables

4. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend client (port 3000).

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run build` - Build the client for production
- `npm run install-all` - Install dependencies for both client and server

## Technology Stack

### Frontend (Client)
- React.js
- Tailwind CSS
- Axios for API calls

### Backend (Server)
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.