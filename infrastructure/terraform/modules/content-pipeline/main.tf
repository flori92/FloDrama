resource "aws_sqs_queue" "scraping_tasks" {
  name = "flodrama-${var.environment}-scraping-tasks"
  visibility_timeout_seconds = 900
  message_retention_seconds = 86400
  delay_seconds = 0
  
  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-scraping-queue"
  }
}

resource "aws_sqs_queue" "metadata_processing" {
  name = "flodrama-${var.environment}-metadata-processing"
  visibility_timeout_seconds = 900
  message_retention_seconds = 86400
  
  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-metadata-queue"
  }
}

resource "aws_lambda_function" "scraper" {
  filename         = "lambda/scraper.zip"
  function_name    = "flodrama-${var.environment}-scraper"
  role            = aws_iam_role.scraper_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 900
  memory_size     = 1024

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.metadata_processing.url
      MONGODB_URI = var.mongodb_uri
      REDIS_HOST = var.redis_host
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-scraper"
  }
}

resource "aws_lambda_function" "metadata_processor" {
  filename         = "lambda/metadata_processor.zip"
  function_name    = "flodrama-${var.environment}-metadata-processor"
  role            = aws_iam_role.metadata_processor_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  memory_size     = 1024

  environment {
    variables = {
      MONGODB_URI = var.mongodb_uri
      REDIS_HOST = var.redis_host
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.content.endpoint
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-metadata-processor"
  }
}

resource "aws_opensearch_domain" "content" {
  domain_name = "flodrama-${var.environment}-content"
  engine_version = "OpenSearch_2.5"

  cluster_config {
    instance_type = "t3.small.search"
    instance_count = 2
    zone_awareness_enabled = true
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-content-search"
  }
}

resource "aws_eventbridge_rule" "scraping_schedule" {
  name                = "flodrama-${var.environment}-scraping-schedule"
  description         = "Planification des tâches de scraping"
  schedule_expression = "rate(6 hours)"

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-scraping-schedule"
  }
}

resource "aws_eventbridge_target" "scraping_target" {
  rule      = aws_eventbridge_rule.scraping_schedule.name
  target_id = "ScrapingLambda"
  arn       = aws_lambda_function.scraper.arn
}

resource "aws_sqs_queue_policy" "scraping_tasks" {
  queue_url = aws_sqs_queue.scraping_tasks.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.scraping_tasks.arn
      }
    ]
  })
}
