# 💬 Convo

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/UtkarshSolanki07/Convo?utm_source=oss&utm_medium=github&utm_campaign=UtkarshSolanki07%2FConvo&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![React Version](https://img.shields.io/badge/react-19.2.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.10.1-green)
![License](https://img.shields.io/badge/license-ISC-blue)
![Status](https://img.shields.io/badge/status-active-success)
![GitHub last commit](https://img.shields.io/github/last-commit/UtkarshSolanki07/Convo)
![GitHub issues](https://img.shields.io/github/issues/UtkarshSolanki07/Convo)
![GitHub pull requests](https://img.shields.io/github/issues-pr/UtkarshSolanki07/Convo)

A modern, real-time chat application built with the MERN stack, featuring secure authentication, instant messaging, and a beautiful user interface.

## ✨ Features

- 🔐 **Secure Authentication** - User registration, login, logout, and profile updates with JWT tokens
- 💬 **Real-time Messaging** - Instant chat with Socket.io for bidirectional communication
- 👥 **Contact Management** - View and manage chat contacts and partners
- 🎨 **Modern UI** - Beautiful, responsive interface built with React 19, Tailwind CSS, and DaisyUI
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🔒 **Security** - Password hashing with bcryptjs, Arcjet protection, and secure middleware
- 🌐 **CORS Enabled** - Secure cross-origin requests with proper configuration
- ☁️ **Cloud Storage** - Cloudinary integration for media file uploads and management
- 🗄️ **Database** - MongoDB with Mongoose ODM for efficient data modeling
- 🎵 **Sound Effects** - Keyboard and notification sounds for enhanced user experience
- 🔥 **Hot Reload** - Fast development with Vite and React Hot Toast notifications

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **Lucide React** - Beautiful icons
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Arcjet** - Security protection
- **Cloudinary** - Cloud media storage

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/UtkarshSolanki07/Convo.git
   cd Convo
   ```

2. **Install dependencies**

   ```bash
   npm run build
   ```

3. **Set up environment variables**

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ARCJET_KEY=your_arcjet_key
   ```

4. **Start the application**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

### Development Mode

For development with hot reload:

```bash
# Start backend in development mode
cd backend
npm run dev

# Start frontend in development mode (in another terminal)
cd frontend
npm run dev
```

## 📁 Project Structure

```
Convo/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── emails/         # Email templates
│   │   ├── lib/           # Utility functions
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── server.js      # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── App.jsx        # Main App component
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/update-profile` - Update user profile
- `GET /api/auth/check` - Check authentication status

### Messages

- `GET /api/messages/contacts` - Get all user contacts
- `GET /api/messages/chats` - Get all chat partners
- `GET /api/messages/:id` - Get messages with specific user
- `POST /api/messages/send/:id` - Send message to specific user

## 📸 Screenshots

*Coming soon - Screenshots will be added once the application is fully deployed.*

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables for production**
   ```env
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://yourdomain.com
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_secure_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ARCJET_KEY=your_arcjet_key
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Environment Setup

- **MongoDB**: Set up a MongoDB Atlas cluster or local MongoDB instance
- **Cloudinary**: Create a Cloudinary account for media storage
- **Arcjet**: Get API key from Arcjet dashboard for security protection

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Development Testing

- Use the development mode for hot reloading during testing
- Check browser console for any errors
- Test real-time messaging with multiple browser tabs

## 🔧 Troubleshooting

### Common Issues

**Connection Issues:**
- Ensure MongoDB is running and connection string is correct
- Check firewall settings for database access

**Authentication Problems:**
- Verify JWT_SECRET is set and secure
- Check token expiration settings

**Real-time Messaging:**
- Ensure Socket.io server is running on correct port
- Check CORS settings for frontend-backend communication

**Media Upload Issues:**
- Verify Cloudinary credentials are correct
- Check file size limits in server configuration

### Getting Help

- Check the [Issues](https://github.com/UtkarshSolanki07/Convo/issues) page for similar problems
- Create a new issue with detailed error logs and steps to reproduce

## 🌐 Live Demo

Coming soon! The application is currently in development.

## 🤝 Contributing

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

### Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Pull Request Process

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Any contributions you make will be under the ISC Software License

In short, when you submit code changes, your submissions are understood to be under the same [ISC License](http://choosealicense.com/licenses/isc/) that covers the project. Feel free to contact the maintainers if that's a concern.

### Report bugs using GitHub's [issues](../../issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](../../issues/new); it's that easy!

### Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### License

By contributing, you agree that your contributions will be licensed under its ISC License.

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by modern chat applications
- Thanks to all contributors and the open-source community

## 📞 Contact

If you have any questions or suggestions, feel free to:

- Open an issue on GitHub
- Reach out via the repository discussions

---

**Made with ❤️ by [Utkarsh Solanki](https://github.com/UtkarshSolanki07)**
