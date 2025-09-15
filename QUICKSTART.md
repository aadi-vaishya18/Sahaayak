# Community Resource Dashboard - Quick Start Guide

🚀 **Get your Community Resource Dashboard MVP running in minutes!**

## 🎯 What You'll Get

A fully functional MVP with:
- 🏥 **Resource Management** - Healthcare, shelters, food distribution, emergency services
- 🚨 **Emergency Requests** - Citizens can request help with automatic priority assignment
- 🤝 **Volunteer Coordination** - Registration and matching system
- 🗺️ **Interactive Maps** - Real-time resource locations with Leaflet/OpenStreetMap
- ⚡ **Real-time Updates** - WebSocket-powered live notifications
- 📊 **Admin Dashboard** - Statistics and management tools

## 🏁 Quick Setup (Development)

### Prerequisites
- Node.js (v16 or higher)
- Git
- Modern web browser

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (optional - no build step needed for static files)
cd ../frontend
# Static files, no dependencies required
```

### 2. Initialize Database

```bash
cd backend
npm run db:init
```

### 3. Start the Backend

```bash
cd backend
npm run dev
```
The API will be available at `http://localhost:3001`

### 4. Start the Frontend

Simply open `frontend/index.html` in your browser, or serve it with a local server:

```bash
# Option 1: Open directly
open frontend/index.html

# Option 2: Use Python's built-in server
cd frontend
python -m http.server 3000

# Option 3: Use Node.js serve
npx serve frontend -p 3000
```

The dashboard will be available at `http://localhost:3000`

## 🐳 Docker Setup (Production-Ready)

### Prerequisites
- Docker
- Docker Compose

### 1. Clone and Deploy

```bash
# Make deployment script executable (Unix/Mac)
chmod +x scripts/deploy.sh

# Deploy with Docker Compose
./scripts/deploy.sh

# Or manually
docker-compose up -d
```

### 2. Initialize Database

```bash
docker-compose run --rm database-init
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🎮 Try It Out

### 1. Explore Resources
- Browse community resources on the main page
- Use filters to find specific types of help
- Click map markers for detailed information

### 2. Submit Emergency Request
- Click the "Emergency" tab
- Fill out the form with your situation
- See automatic priority assignment based on keywords
- Watch real-time updates in the admin section

### 3. Register as Volunteer
- Click the "Volunteer" tab
- Register with your skills and availability
- View the volunteer list

### 4. Admin Dashboard
- Check statistics and recent activity
- Monitor emergency requests
- See real-time system status

## 🧪 Testing

### Run API Tests
```bash
cd backend
npm test
```

### Test Priority Assignment
Try these keywords in emergency requests:
- **High Priority**: "urgent", "emergency", "critical", "ambulance"
- **Low Priority**: "information", "routine", "non-urgent"
- **Medium Priority**: Everything else (default)

## 📁 Project Structure

```
community-resource-dashboard/
├── backend/                 # Node.js API server
│   ├── routes/             # API endpoints
│   ├── models/             # Database models
│   ├── scripts/            # Database initialization
│   └── tests/              # Test suite
├── frontend/               # Static web application
│   ├── css/               # Styles
│   ├── js/                # Client-side code
│   └── index.html         # Main page
├── docs/                   # Documentation
│   ├── API.md             # API documentation
│   └── USER_GUIDE.md      # User guide
├── scripts/               # Deployment scripts
└── docker-compose.yml     # Container orchestration
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
NODE_ENV=development
PORT=3001
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:3000
```

### Sample Data Included
The system comes with sample data:
- 6 resource categories
- 5 community resources
- 3 registered volunteers
- Various operating hours and availability info

## 🌟 Key Features Demo

### Real-time Updates
1. Open two browser windows
2. Submit an emergency request in one
3. Watch notifications appear in the admin section of the other

### Map Integration
- Resources show with color-coded markers
- Click markers for details and directions
- Your location appears as a blue icon

### Priority System
- Type "urgent medical emergency" → High Priority (red)
- Type "general information question" → Low Priority (green)
- Type "need community help" → Medium Priority (yellow)

### Volunteer Matching
- System matches volunteers to requests by skills and location
- View matching scores in admin section

## 🚨 Troubleshooting

### Common Issues

**API not starting:**
- Check if port 3001 is available
- Ensure Node.js version is 16+
- Run `npm install` in backend directory

**Frontend not loading:**
- Check browser console for errors
- Ensure backend is running first
- Try different browser

**Database errors:**
- Delete `database.sqlite` and run `npm run db:init`
- Check file permissions

**Map not working:**
- Check internet connection
- Ensure location permissions granted
- Try refreshing the page

### Getting Help

1. Check browser console (F12)
2. Check backend logs
3. Review API documentation in `docs/API.md`
4. Try the test suite: `npm test`

## 🎯 Next Steps

### Customize for Your Community
1. Update sample data in `backend/scripts/initDatabase.js`
2. Modify categories for your local needs
3. Add your community's actual resources
4. Customize map center location in `frontend/js/map.js`

### Production Deployment
1. Use Docker Compose with proper environment variables
2. Set up SSL/TLS with reverse proxy
3. Configure proper CORS settings
4. Set up monitoring and logging

### Extend the System
- Add authentication for resource providers
- Integrate with SMS/email notifications
- Add mobile apps using the API
- Implement advanced analytics

## 🏆 Success Indicators

You'll know it's working when:
- ✅ Health check returns OK at `/api/health`
- ✅ Resources display on map with colored markers
- ✅ Emergency requests show priority assignment
- ✅ Volunteers appear in registration list
- ✅ Real-time updates work between browser tabs
- ✅ Statistics update in admin dashboard

## 🤝 Contributing

This is your community resource dashboard! Feel free to:
- Add new features
- Improve the UI/UX
- Add more resource types
- Enhance the matching algorithm
- Contribute back to help other communities

---

**🎉 You now have a fully functional Community Resource Dashboard MVP!**

Need help? Check the detailed documentation in the `docs/` folder or review the API endpoints at `http://localhost:3001/api/health` once running.

---

*Built for AICTE MIC-Student Innovation - Making community resources accessible to everyone.*