# InternshipHub - Internship Management System

A modern, responsive internship management portal built with React, Tailwind CSS, and Firebase. This platform connects students with internship opportunities and provides companies with tools to manage their internship programs.

## 🚀 Features

### For Students
- **Browse Internships**: Search and filter through thousands of internship opportunities
- **Apply Online**: Easy application process with profile management
- **Track Applications**: Monitor application status and progress
- **Save Favorites**: Bookmark interesting internships for later
- **Profile Management**: Build comprehensive student profiles

### For Companies/Admins
- **Post Internships**: Create and manage internship listings
- **Application Management**: Review and manage student applications
- **Dashboard Analytics**: Track posting performance and applications
- **User Management**: Manage admin accounts and permissions

### General Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **Real-time Updates**: Firebase-powered real-time data synchronization
- **Secure Authentication**: Firebase Auth with email/password support
- **Advanced Search**: Filter by location, type, company, and more

## 🛠️ Technologies Used

- **Frontend**: React 19.1.1, Tailwind CSS 3.4.17
- **Backend**: Firebase (Authentication, Firestore Database, Storage)
- **Routing**: React Router DOM
- **Icons**: React Icons (Feather Icons)
- **Styling**: Tailwind CSS with custom configurations

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm or yarn package manager
- A Firebase project set up

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd internship_portal_latest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - The Firebase configuration is already set up in `src/firebase.js`
   - Make sure your Firebase project (`scontitech-286b2`) is properly configured

## ⚙️ Firebase Setup (IMPORTANT)

Before running the application, you need to enable authentication in your Firebase project:

### Step 1: Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `scontitech-286b2`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Toggle **Enable** and save changes

### Step 2: Set up Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Create a database (start in test mode for development)
3. The app will automatically create the required collections:
   - `users` - User profiles
   - `internships` - Internship listings
   - `applications` - Student applications

### Step 3: Configure Security Rules (Recommended)
Update your Firestore security rules for production use.

## 🚀 Running the Application

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - If port 3000 is busy, the app will prompt you to use another port

## 📱 Application Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLogin.js
│   │   ├── AdminRegister.js
│   │   └── AdminDashboard.js
│   ├── LandingPage.js
│   ├── Login.js
│   ├── Register.js
│   ├── StudentDashboard.js
│   └── SetupGuide.js
├── contexts/
│   └── AuthContext.js
├── firebase.js
├── App.js
└── index.js
```

## 🎯 Key Pages

- **Landing Page** (`/`) - Marketing page with features and testimonials
- **Student Registration** (`/register`) - Student account creation
- **Student Login** (`/login`) - Student authentication
- **Student Dashboard** (`/dashboard`) - Browse and apply for internships
- **Admin Registration** (`/admin/register`) - Company admin account creation
- **Admin Login** (`/admin/login`) - Admin authentication
- **Admin Dashboard** (`/admin/dashboard`) - Manage internships and applications
- **Setup Guide** (`/setup-guide`) - Firebase configuration help

## 🔐 User Roles

### Students
- Can register, login, and browse internships
- Can apply for internships and track applications
- Profile includes university, major, graduation year

### Admins (Companies)
- Can register, login, and post internships
- Can manage applications and view analytics
- Profile includes company info and job title

## 🎨 Customization

### Tailwind CSS Configuration
The project uses a custom Tailwind configuration with:
- Custom color palette (primary blues)
- Inter font family
- Extended theme configurations

### Firebase Configuration
Update `src/firebase.js` with your own Firebase project credentials if needed.

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting** (optional)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## 🐛 Troubleshooting

### Authentication Errors
If you see `auth/operation-not-allowed` errors:
1. Visit `/setup-guide` in the application
2. Follow the Firebase setup instructions
3. Ensure Email/Password authentication is enabled

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

## 📝 Available Scripts

- `npm start` - Runs the development server
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (not recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions:
- Check the `/setup-guide` page in the application
- Review Firebase documentation
- Create an issue in the repository

---

Built with ❤️ using React, Tailwind CSS, and Firebase

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# Interns_Hub
# Interns_Hub
