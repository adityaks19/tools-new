const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// S3 Configuration for file storage
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  signatureVersion: 'v4'
});

// DynamoDB Configuration for user data and file metadata
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Lambda Configuration for file processing
const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION || 'us-east-1'
});

// SES Configuration for email notifications
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

// CloudWatch Configuration for logging and monitoring
const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Cognito Configuration for user authentication
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION || 'us-east-1'
});

// API Gateway Configuration (for external API calls)
const apigateway = new AWS.APIGateway({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Textract Configuration for document text extraction
const textract = new AWS.Textract({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Comprehend Configuration for NLP processing
const comprehend = new AWS.Comprehend({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Bedrock Configuration for AI/ML processing
const bedrock = new AWS.BedrockRuntime({
  region: process.env.AWS_REGION || 'us-east-1'
});

// SNS Configuration for notifications
const sns = new AWS.SNS({
  region: process.env.AWS_REGION || 'us-east-1'
});

// SQS Configuration for message queuing
const sqs = new AWS.SQS({
  region: process.env.AWS_REGION || 'us-east-1'
});

// CloudFront Configuration for CDN
const cloudfront = new AWS.CloudFront({
  region: process.env.AWS_REGION || 'us-east-1'
});

// ElastiCache Configuration for caching
const elasticache = new AWS.ElastiCache({
  region: process.env.AWS_REGION || 'us-east-1'
});

// RDS Configuration for relational database (if needed)
const rds = new AWS.RDS({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Secrets Manager Configuration for secure credential storage
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Parameter Store Configuration for configuration management
const ssm = new AWS.SSM({
  region: process.env.AWS_REGION || 'us-east-1'
});

// CloudFormation Configuration for infrastructure as code
const cloudformation = new AWS.CloudFormation({
  region: process.env.AWS_REGION || 'us-east-1'
});

// IAM Configuration for access management
const iam = new AWS.IAM({
  region: process.env.AWS_REGION || 'us-east-1'
});

// KMS Configuration for encryption
const kms = new AWS.KMS({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Step Functions Configuration for workflow orchestration
const stepfunctions = new AWS.StepFunctions({
  region: process.env.AWS_REGION || 'us-east-1'
});

// EventBridge Configuration for event-driven architecture
const eventbridge = new AWS.EventBridge({
  region: process.env.AWS_REGION || 'us-east-1'
});

// X-Ray Configuration for distributed tracing
const xray = new AWS.XRay({
  region: process.env.AWS_REGION || 'us-east-1'
});

module.exports = {
  // Core Services
  s3,
  dynamodb,
  lambda,
  
  // AI/ML Services
  textract,
  comprehend,
  bedrock,
  
  // Authentication & Security
  cognito,
  iam,
  kms,
  secretsManager,
  
  // Communication Services
  ses,
  sns,
  sqs,
  
  // Monitoring & Logging
  cloudwatch,
  xray,
  
  // Infrastructure Services
  apigateway,
  cloudfront,
  elasticache,
  rds,
  ssm,
  cloudformation,
  
  // Workflow & Events
  stepfunctions,
  eventbridge,
  
  // Configuration
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  
  // S3 Bucket Names
  UPLOADS_BUCKET: process.env.AWS_S3_UPLOADS_BUCKET || 'nlp-converter-uploads',
  PROCESSED_BUCKET: process.env.AWS_S3_PROCESSED_BUCKET || 'nlp-converter-processed',
  
  // DynamoDB Table Names
  USERS_TABLE: process.env.AWS_DYNAMODB_USERS_TABLE || 'nlp-converter-users',
  FILES_TABLE: process.env.AWS_DYNAMODB_FILES_TABLE || 'nlp-converter-files',
  SESSIONS_TABLE: process.env.AWS_DYNAMODB_SESSIONS_TABLE || 'nlp-converter-sessions',
  
  // Lambda Function Names
  FILE_PROCESSOR_FUNCTION: process.env.AWS_LAMBDA_FILE_PROCESSOR || 'nlp-converter-file-processor',
  NLP_PROCESSOR_FUNCTION: process.env.AWS_LAMBDA_NLP_PROCESSOR || 'nlp-converter-nlp-processor',
  
  // Cognito Configuration
  COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID,
  
  // SES Configuration
  SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL || 'noreply@nlpconverter.com',
  
  // SNS Topic ARNs
  NOTIFICATION_TOPIC_ARN: process.env.AWS_SNS_NOTIFICATION_TOPIC_ARN,
  
  // SQS Queue URLs
  FILE_PROCESSING_QUEUE_URL: process.env.AWS_SQS_FILE_PROCESSING_QUEUE_URL,
  
  // CloudFront Distribution
  CLOUDFRONT_DISTRIBUTION_ID: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
  
  // ElastiCache Configuration
  ELASTICACHE_CLUSTER_ID: process.env.AWS_ELASTICACHE_CLUSTER_ID,
  
  // KMS Key IDs
  KMS_KEY_ID: process.env.AWS_KMS_KEY_ID,
  
  // Step Functions State Machine ARNs
  FILE_PROCESSING_STATE_MACHINE_ARN: process.env.AWS_STEP_FUNCTIONS_FILE_PROCESSING_ARN,
  
  // EventBridge Event Bus
  EVENT_BUS_NAME: process.env.AWS_EVENTBRIDGE_EVENT_BUS_NAME || 'nlp-converter-events'
};
