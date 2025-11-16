#!/bin/bash

# Sweet Shop Test Runner Script
# This script runs comprehensive tests for both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        print_error "Directory $1 does not exist!"
        exit 1
    fi
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running Backend Tests..."
    
    cd /home/alokhans/Documents/SweetShop
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Run database setup
    print_status "Setting up test database..."
    npm run db:migrate
    
    # Run unit tests
    print_status "Running backend unit tests..."
    npm run test:unit
    
    # Run integration tests
    print_status "Running backend integration tests..."
    npm run test:integration
    
    print_success "Backend tests completed!"
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running Frontend Tests..."
    
    cd /home/alokhans/Documents/SweetShop/frontend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run component tests
    print_status "Running frontend component tests..."
    npm run test:components
    
    # Run utility tests
    print_status "Running frontend utility tests..."
    npm run test:utils
    
    print_success "Frontend tests completed!"
}

# Function to generate coverage reports
generate_coverage() {
    print_status "Generating coverage reports..."
    
    # Backend coverage
    cd /home/alokhans/Documents/SweetShop
    print_status "Generating backend coverage..."
    npm run test:coverage
    
    # Frontend coverage
    cd /home/alokhans/Documents/SweetShop/frontend
    print_status "Generating frontend coverage..."
    npm run test:coverage
    
    print_success "Coverage reports generated!"
    print_status "Backend coverage: /home/alokhans/Documents/SweetShop/coverage/lcov-report/index.html"
    print_status "Frontend coverage: /home/alokhans/Documents/SweetShop/frontend/coverage/lcov-report/index.html"
}

# Function to run all tests
run_all_tests() {
    print_status "Starting comprehensive test suite for Sweet Shop..."
    
    # Check if main directory exists
    check_directory "/home/alokhans/Documents/SweetShop"
    check_directory "/home/alokhans/Documents/SweetShop/frontend"
    
    # Run backend tests
    run_backend_tests
    
    # Run frontend tests
    run_frontend_tests
    
    # Generate coverage if requested
    if [ "$1" = "--coverage" ]; then
        generate_coverage
    fi
    
    print_success "All tests completed successfully! 🎉"
}

# Function to run CI tests (non-interactive)
run_ci_tests() {
    print_status "Running CI test suite..."
    
    # Backend CI tests
    cd /home/alokhans/Documents/SweetShop
    npm run test:ci
    
    # Frontend CI tests
    cd /home/alokhans/Documents/SweetShop/frontend
    npm run test:ci
    
    print_success "CI tests completed!"
}

# Function to show help
show_help() {
    echo "Sweet Shop Test Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --backend     Run only backend tests"
    echo "  --frontend    Run only frontend tests"
    echo "  --coverage    Run all tests with coverage reports"
    echo "  --ci          Run CI tests (non-interactive)"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --backend          # Run only backend tests"
    echo "  $0 --coverage         # Run all tests with coverage"
    echo "  $0 --ci               # Run CI tests"
}

# Main script logic
case "${1:-}" in
    --backend)
        run_backend_tests
        ;;
    --frontend)
        run_frontend_tests
        ;;
    --coverage)
        run_all_tests --coverage
        ;;
    --ci)
        run_ci_tests
        ;;
    --help)
        show_help
        ;;
    "")
        run_all_tests
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
