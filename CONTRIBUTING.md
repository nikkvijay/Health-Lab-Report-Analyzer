# Contributing to HLRA

Thank you for your interest in contributing to the Health Lab Report Analyzer (HLRA) project! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)
- [Security](#security)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites
- **Backend**: Python 3.11+, MongoDB, Tesseract OCR
- **Frontend**: Node.js 18+, npm/yarn
- **Tools**: Git, Docker (optional)

### Fork and Clone
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/Health-Lab-Report-Analyzer.git
   cd Health-Lab-Report-Analyzer
   ```

3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/nikkvijay/Health-Lab-Report-Analyzer.git
   ```

### Environment Setup

#### Backend Setup
```bash
cd HLRA-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python main.py
```

#### Frontend Setup
```bash
cd HLRA-frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## 🔄 Development Workflow

### Branch Naming Convention
- **Feature branches**: `feature/description-of-feature`
- **Bug fixes**: `fix/description-of-bug`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/what-docs-change`
- **Refactoring**: `refactor/what-is-being-refactored`

### Workflow Steps
1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   # Backend tests
   cd HLRA-backend && pytest
   
   # Frontend tests
   cd HLRA-frontend && npm test
   ```

4. **Commit your changes** using conventional commits:
   ```bash
   git add .
   git commit -m "feat: add new health metric extraction"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Conventional Commits
We use conventional commit messages. Format: `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Formatting changes (no code change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add password reset functionality
fix(upload): resolve file size validation issue
docs(api): update authentication endpoint documentation
test(extraction): add OCR service unit tests
```



## 🔍 Pull Request Process

### Before Submitting
- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New code is covered by tests
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with main

### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How to Test
Steps to test the changes:
1. Step 1
2. Step 2
3. Expected result

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process
1. **Automated checks** must pass (CI/CD, linting, tests)
2. **Code review** by at least one maintainer
3. **Documentation review** if docs were changed
4. **Manual testing** for significant features
5. **Approval** and merge by maintainer

## 🐛 Issue Guidelines

### Bug Reports
Include:
- **Description** of the bug
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, versions)

### Feature Requests
Include:
- **Problem description** - what problem does this solve?
- **Proposed solution** - how should it work?
- **Alternatives considered** - what other solutions did you consider?
- **Additional context** - mockups, examples, etc.

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high/medium/low` - Issue priority
- `backend` - Backend-related issue
- `frontend` - Frontend-related issue

## 📚 Documentation

### What to Document
- **API changes** - Update API.md
- **New features** - Update relevant README files
- **Setup changes** - Update installation guides
- **Architecture changes** - Update project documentation

### Documentation Style
- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date with code changes
- Use proper markdown formatting

## 🔒 Security

### Security Issues
**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, email security concerns to: [project-security-email]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices
- Never commit secrets, API keys, or passwords
- Use environment variables for sensitive configuration
- Follow secure coding practices
- Keep dependencies updated
- Validate all user inputs

## 🎉 Recognition

Contributors will be recognized in:
- GitHub contributors section
- README acknowledgments
- Release notes for significant contributions

Thank you for contributing to HLRA! Your efforts help make healthcare data more accessible and useful for everyone. 🏥💙