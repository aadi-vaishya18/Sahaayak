# Community Resource Dashboard

**Problem Statement ID:** 25132  
**Organization:** AICTE  
**Department:** AICTE, MIC-Student Innovation  
**Category:** Software  
**Theme:** Miscellaneous  

## Overview

An integrated digital platform that connects citizens with essential community resources such as healthcare, shelters, food distribution centers, and emergency services. This MVP focuses on improving accessibility, response time, and transparency in community support systems.

## Features

### Core Features (MVP)
- 🗺️ **Real-time Resource Mapping** - Interactive map showing available community resources
- 🚨 **Emergency Request System** - Citizens can submit urgent requests for help
- 📂 **Resource Categorization** - Healthcare, shelters, food distribution, emergency services
- ⚡ **Priority-based Issue Handling** - Automatic categorization by urgency level
- 👥 **Volunteer Coordination** - Connect volunteers with community needs
- 🔄 **Real-time Updates** - Live updates on resource availability and requests

### Future Enhancements
- 🎤 Voice-to-text call handling for urgent requests
- 📱 Mobile application
- 🔔 Push notifications for volunteers
- 📊 Analytics dashboard for administrators
- 🌐 Multi-language support

## Technology Stack

- **Backend:** Node.js with Express.js
- **Database:** SQLite (MVP), PostgreSQL (production)
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Real-time:** WebSockets (Socket.io)
- **Mapping:** Leaflet.js with OpenStreetMap
- **Deployment:** Docker

## Project Structure

```
community-resource-dashboard/
├── backend/           # Node.js API server
├── frontend/          # Web application
├── docs/             # Documentation
├── README.md
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd community-resource-dashboard
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Start the development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## API Endpoints

- `GET /api/resources` - List all resources
- `POST /api/resources` - Add new resource
- `GET /api/emergency-requests` - List emergency requests
- `POST /api/emergency-requests` - Submit new emergency request
- `GET /api/volunteers` - List volunteers
- `POST /api/volunteers/register` - Register as volunteer

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions about this project, please contact the development team.

---

*Built for AICTE MIC-Student Innovation program - Making community resources more accessible to everyone.*