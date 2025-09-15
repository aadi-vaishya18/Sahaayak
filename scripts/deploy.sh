#!/bin/bash

# Community Resource Dashboard Deployment Script
# This script handles deployment of the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="community-resource-dashboard"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

echo -e "${GREEN}🚀 Community Resource Dashboard Deployment Script${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_status "Docker is installed and running ✓"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            print_error "Docker Compose is not available. Please install Docker Compose."
            exit 1
        else
            COMPOSE_CMD="docker compose"
        fi
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    print_status "Docker Compose is available ✓"
}

# Create necessary directories
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p data
    mkdir -p logs
    mkdir -p ssl
    print_status "Directories created ✓"
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    $COMPOSE_CMD run --rm database-init
    print_status "Database initialized ✓"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    $COMPOSE_CMD build
    $COMPOSE_CMD up -d
    print_status "Services started ✓"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_status "Backend service is healthy ✓"
    else
        print_warning "Backend service might not be ready yet"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_status "Frontend service is healthy ✓"
    else
        print_warning "Frontend service might not be ready yet"
    fi
}

# Show deployment information
show_info() {
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "======================================"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:3001"
    echo "🏥 Health Check: http://localhost:3001/api/health"
    echo ""
    echo "📊 Useful commands:"
    echo "  View logs: $COMPOSE_CMD logs -f"
    echo "  Stop services: $COMPOSE_CMD down"
    echo "  Restart services: $COMPOSE_CMD restart"
    echo "  View status: $COMPOSE_CMD ps"
    echo ""
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    $COMPOSE_CMD down
    print_status "Services stopped ✓"
}

# Clean up everything
cleanup() {
    print_status "Cleaning up..."
    $COMPOSE_CMD down -v --rmi all
    docker system prune -f
    print_status "Cleanup completed ✓"
}

# Update services
update_services() {
    print_status "Updating services..."
    $COMPOSE_CMD pull
    $COMPOSE_CMD build --no-cache
    $COMPOSE_CMD up -d
    print_status "Services updated ✓"
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_docker
    check_docker_compose
    setup_directories
    start_services
    check_health
    show_info
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "stop")
        stop_services
        ;;
    "cleanup")
        cleanup
        ;;
    "update")
        update_services
        ;;
    "logs")
        $COMPOSE_CMD logs -f
        ;;
    "status")
        $COMPOSE_CMD ps
        ;;
    "init-db")
        init_database
        ;;
    *)
        echo "Usage: $0 {deploy|stop|cleanup|update|logs|status|init-db}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  stop     - Stop all services"
        echo "  cleanup  - Remove all containers, images, and volumes"
        echo "  update   - Update and restart services"
        echo "  logs     - View service logs"
        echo "  status   - Show service status"
        echo "  init-db  - Initialize database with sample data"
        exit 1
        ;;
esac