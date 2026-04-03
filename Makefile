# Sereni Base UI Makefile
# Standard commands for React/TypeScript development workflow

.PHONY: help setup install dev build test test-watch test-coverage lint lint-fix format type-check clean docker release

# Default target
.DEFAULT_GOAL := help

# Variables
PACKAGE_NAME := sereni-base-ui
VERSION := $(shell node -p -e "require('./package.json').version" 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
NODE_VERSION := $(shell node --version 2>/dev/null || echo "unknown")

##@ Help
help: ## Display this help message
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Available Targets:"
	@echo "  setup              - Install development dependencies"
	@echo "  install            - Alias for setup"
	@echo "  dev                - Start development server"
	@echo "  dev-https          - Start development server with HTTPS"
	@echo "  preview            - Preview production build locally"
	@echo "  storybook          - Start Storybook development server"
	@echo "  build              - Build for production"
	@echo "  build-storybook    - Build Storybook for production"
	@echo "  test               - Run tests"
	@echo "  test-watch         - Run tests in watch mode"
	@echo "  test-ui            - Run tests with UI"
	@echo "  test-coverage      - Run tests with coverage report"
	@echo "  test-e2e           - Run end-to-end tests"
	@echo "  test-e2e-headed    - Run E2E tests with browser UI"
	@echo "  test-e2e-debug     - Debug E2E tests"
	@echo "  lint               - Run ESLint"
	@echo "  lint-fix           - Run ESLint with auto-fix"
	@echo "  format             - Format code with Prettier"
	@echo "  format-check       - Check if code is formatted"
	@echo "  type-check         - Run TypeScript type checking"
	@echo "  clean              - Clean build artifacts"
	@echo "  docker             - Build Docker image"
	@echo "  docker-dev         - Run Docker in development mode"
	@echo ""

##@ Development
setup: ## Install development dependencies and setup pre-commit hooks
	@echo "🔧 Installing development dependencies..."
	@npm install
	@npm run prepare
	@echo "✅ Development setup complete"

install: setup ## Alias for setup

dev: ## Start development server with hot reload
	@echo "🚀 Starting development server..."
	@npm run dev

dev-https: ## Start development server with HTTPS
	@echo "🚀 Starting development server with HTTPS..."
	@npm run dev -- --https

preview: ## Preview production build locally
	@echo "👀 Starting preview server..."
	@npm run preview

storybook: ## Start Storybook development server
	@echo "📚 Starting Storybook..."
	@npm run storybook

##@ Building
build: ## Build for production
	@echo "🔨 Building for production..."
	@npm run build
	@echo "✅ Production build complete in dist/"

build-storybook: ## Build Storybook for production
	@echo "📚 Building Storybook..."
	@npm run build-storybook
	@echo "✅ Storybook build complete"

##@ Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	@npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	@npm run test:watch

test-ui: ## Run tests with UI
	@echo "🧪 Running tests with UI..."
	@npm run test:ui

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	@npm run test:coverage
	@echo "📈 Coverage report generated"

test-e2e: ## Run end-to-end tests
	@echo "🎭 Running E2E tests..."
	@npx playwright test

test-e2e-headed: ## Run E2E tests with browser UI
	@echo "🎭 Running E2E tests with UI..."
	@npx playwright test --headed

test-e2e-debug: ## Debug E2E tests
	@echo "🎭 Debugging E2E tests..."
	@npx playwright test --debug

##@ Code Quality
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	@npm run lint

lint-fix: ## Run ESLint and fix issues automatically
	@echo "🔧 Running ESLint with auto-fix..."
	@npm run lint:fix

format: ## Format code with Prettier
	@echo "🎨 Formatting code..."
	@npm run format

format-check: ## Check if code is formatted
	@echo "🔍 Checking code formatting..."
	@npm run format:check

type-check: ## Run TypeScript type checking
	@echo "🔍 Running TypeScript checks..."
	@npm run type-check

check: lint type-check test ## Run all quality checks

##@ Docker
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t $(PACKAGE_NAME):$(VERSION) .
	@docker build -t $(PACKAGE_NAME):latest .
	@echo "✅ Docker image built: $(PACKAGE_NAME):$(VERSION)"

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	@docker run --rm -p 3000:3000 $(PACKAGE_NAME):latest

docker-dev: ## Run development environment in Docker
	@echo "🐳 Running development environment..."
	@docker-compose up -d

docker-stop: ## Stop Docker containers
	@echo "🛑 Stopping Docker containers..."
	@docker-compose down

##@ Deployment
deploy-preview: build ## Deploy preview build
	@echo "🚀 Deploying preview..."
	@npm run deploy:preview

deploy-prod: build ## Deploy to production
	@echo "🚀 Deploying to production..."
	@npm run deploy:prod

##@ Package Management
install-deps: ## Install/update dependencies
	@echo "📦 Installing dependencies..."
	@npm install

update-deps: ## Update dependencies
	@echo "📦 Updating dependencies..."
	@npm update
	@npm audit fix

check-deps: ## Check for outdated dependencies
	@echo "🔍 Checking dependencies..."
	@npm outdated

audit: ## Run security audit
	@echo "🔒 Running security audit..."
	@npm audit

##@ Utilities
clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/ build/ coverage/ storybook-static/
	@rm -rf node_modules/.cache
	@echo "✅ Cleanup complete"

clean-all: clean ## Clean everything including node_modules
	@echo "🧹 Deep cleaning..."
	@rm -rf node_modules/
	@npm cache clean --force
	@echo "✅ Deep cleanup complete"

analyze: build ## Analyze bundle size
	@echo "📊 Analyzing bundle size..."
	@npm run analyze

##@ Examples
examples: ## Build and serve examples
	@echo "📚 Building examples..."
	@cd examples/basic-setup && npm install && npm run build
	@cd examples/custom-components && npm install && npm run build
	@echo "✅ Examples built successfully"

##@ Release
version: ## Show version information
	@echo "Package: $(PACKAGE_NAME)"
	@echo "Version: $(VERSION)"
	@echo "Build Time: $(BUILD_TIME)"
	@echo "Node Version: $(NODE_VERSION)"

version-bump-patch: ## Bump patch version
	@echo "📈 Bumping patch version..."
	@npm version patch

version-bump-minor: ## Bump minor version
	@echo "📈 Bumping minor version..."
	@npm version minor

version-bump-major: ## Bump major version
	@echo "📈 Bumping major version..."
	@npm version major

release: check build ## Prepare release
	@echo "🚀 Preparing for release..."
	@npm run build
	@npm pack
	@echo "✅ Release package ready"

##@ CI/CD Helpers
ci-setup: ## Setup for CI environment
	@echo "🤖 Setting up CI environment..."
	@npm ci

ci-test: lint type-check test test-e2e ## Run all CI tests
	@echo "🤖 CI tests complete"

ci-build: build build-storybook ## Build all artifacts for CI
	@echo "🤖 CI build complete"

##@ Development Tools
dev-tools: ## Install global development tools
	@echo "🔧 Installing global development tools..."
	@npm install -g @playwright/test
	@npm install -g typescript
	@npm install -g vite
	@echo "✅ Global tools installed"

server: build ## Serve production build locally
	@echo "🌐 Serving production build..."
	@npx serve -s dist -l 3000