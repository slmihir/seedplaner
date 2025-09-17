# SeedPlanner Serverless API

This is the serverless version of the SeedPlanner API, built with AWS Lambda, DynamoDB, and API Gateway.

## 🏗️ Architecture

- **AWS Lambda**: Serverless compute for API endpoints
- **DynamoDB**: NoSQL database for data storage
- **API Gateway**: HTTP API for request routing
- **S3**: File storage for uploads
- **CloudWatch**: Logging and monitoring

## 📋 Prerequisites

1. **Node.js** >= 18.0.0
2. **AWS CLI** configured with appropriate credentials
3. **Serverless Framework** installed globally:
   ```bash
   npm install -g serverless
   ```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/api-serverless
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

### 3. Deploy to AWS

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

### 4. Update Frontend

After deployment, update your frontend's API URL:

```bash
# Get the API Gateway URL from deployment output
# Update apps/frontend/.env with:
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/dev
```

## 🛠️ Development

### Local Development

```bash
# Start local development server
npm run offline

# The API will be available at http://localhost:4000
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── handlers/           # Lambda function handlers
│   ├── auth/          # Authentication endpoints
│   ├── issues/        # Issue management
│   ├── projects/      # Project management
│   ├── sprints/       # Sprint management
│   └── users/         # User management
├── lib/               # Utility libraries
│   ├── auth.js        # Authentication utilities
│   ├── dynamodb.js    # DynamoDB client
│   ├── response.js    # Response helpers
│   └── validation.js  # Input validation
├── models/            # Data models
│   ├── User.js        # User model
│   ├── Project.js     # Project model
│   └── Issue.js       # Issue model
└── utils/             # Additional utilities
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | No |
| `AWS_REGION` | AWS region for deployment | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |

### DynamoDB Schema

The application uses a single DynamoDB table with the following structure:

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | Partition key (e.g., `USER#123`, `PROJECT#456`) |
| `SK` | String | Sort key (e.g., `USER#123`, `ISSUE#789`) |
| `GSI1PK` | String | Global Secondary Index 1 partition key |
| `GSI1SK` | String | Global Secondary Index 1 sort key |
| `GSI2PK` | String | Global Secondary Index 2 partition key |
| `GSI2SK` | String | Global Secondary Index 2 sort key |

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /users` - List users
- `GET /users/{id}` - Get user by ID
- `PATCH /users/{id}` - Update user

### Projects
- `GET /projects` - List projects
- `GET /projects/{id}` - Get project by ID
- `POST /projects` - Create project
- `PATCH /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Issues
- `GET /issues` - List issues
- `GET /issues/{id}` - Get issue by ID
- `POST /issues` - Create issue
- `PATCH /issues/{id}` - Update issue
- `DELETE /issues/{id}` - Delete issue

### Sprints
- `GET /sprints` - List sprints
- `GET /sprints/{id}` - Get sprint by ID
- `POST /sprints` - Create sprint
- `PATCH /sprints/{id}` - Update sprint
- `DELETE /sprints/{id}` - Delete sprint

## 🔒 Security

- JWT-based authentication
- Role-based access control (admin, manager, developer)
- Input validation using Joi
- CORS enabled for frontend integration
- Environment-based configuration

## 📈 Monitoring

- CloudWatch logs for all Lambda functions
- Error tracking and debugging
- Performance metrics
- Cost monitoring

## 💰 Cost Optimization

- Pay-per-request DynamoDB billing
- Lambda cold start optimization
- Efficient data access patterns
- Minimal dependencies

## 🚀 Deployment

### Manual Deployment

```bash
# Deploy to specific stage
serverless deploy --stage dev
serverless deploy --stage prod
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Deploy Serverless API
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy:prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🔧 Troubleshooting

### Common Issues

1. **Cold Start Latency**
   - First request after idle period takes 1-3 seconds
   - Consider using provisioned concurrency for critical functions

2. **DynamoDB Throttling**
   - Implement exponential backoff
   - Use batch operations where possible

3. **CORS Issues**
   - Ensure CORS is properly configured in serverless.yml
   - Check frontend API URL configuration

### Debugging

```bash
# View logs
serverless logs -f functionName --stage dev

# Invoke function locally
serverless invoke local -f functionName --data '{"body": "{}"}'
```

## 📚 Additional Resources

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
