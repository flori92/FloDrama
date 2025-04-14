resource "aws_s3_bucket" "personalize_data" {
  bucket = "flodrama-${var.environment}-personalize-data"

  tags = {
    Name        = "flodrama-${var.environment}-personalize-data"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "personalize_data" {
  bucket = aws_s3_bucket.personalize_data.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "personalize_data" {
  bucket = aws_s3_bucket.personalize_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_iam_role" "personalize" {
  name = "flodrama-${var.environment}-personalize-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "personalize.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "flodrama-${var.environment}-personalize-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "personalize_s3" {
  name = "flodrama-${var.environment}-personalize-s3-policy"
  role = aws_iam_role.personalize.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.personalize_data.arn,
          "${aws_s3_bucket.personalize_data.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "personalize_cloudwatch" {
  name = "flodrama-${var.environment}-personalize-cloudwatch-policy"
  role = aws_iam_role.personalize.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_personalize_dataset_group" "main" {
  name = "flodrama-${var.environment}-dataset-group"

  tags = {
    Environment = var.environment
  }
}

resource "aws_personalize_schema" "interactions" {
  name = "flodrama-${var.environment}-interactions"
  schema = jsonencode({
    type = "record"
    name = "Interactions"
    namespace = "com.flodrama.personalize"
    fields = [
      {
        name = "USER_ID"
        type = "string"
      },
      {
        name = "ITEM_ID"
        type = "string"
      },
      {
        name = "TIMESTAMP"
        type = "long"
      },
      {
        name = "EVENT_TYPE"
        type = "string"
      },
      {
        name = "WATCH_TIME"
        type = "float"
      }
    ]
    version = "1.0"
  })
}

resource "aws_personalize_schema" "items" {
  name = "flodrama-${var.environment}-items"
  schema = jsonencode({
    type = "record"
    name = "Items"
    namespace = "com.flodrama.personalize"
    fields = [
      {
        name = "ITEM_ID"
        type = "string"
      },
      {
        name = "GENRES"
        type = "string"
        categorical = true
      },
      {
        name = "CREATION_TIMESTAMP"
        type = "long"
      },
      {
        name = "LANGUAGE"
        type = "string"
        categorical = true
      },
      {
        name = "DURATION"
        type = "float"
      },
      {
        name = "POPULARITY_SCORE"
        type = "float"
      }
    ]
    version = "1.0"
  })
}

resource "aws_personalize_dataset" "interactions" {
  name               = "flodrama-${var.environment}-interactions"
  dataset_group_arn  = aws_personalize_dataset_group.main.arn
  dataset_type       = "Interactions"
  schema_arn         = aws_personalize_schema.interactions.arn

  tags = {
    Environment = var.environment
  }
}

resource "aws_personalize_dataset" "items" {
  name               = "flodrama-${var.environment}-items"
  dataset_group_arn  = aws_personalize_dataset_group.main.arn
  dataset_type       = "Items"
  schema_arn         = aws_personalize_schema.items.arn

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "personalize_solution_training" {
  alarm_name          = "flodrama-${var.environment}-personalize-training"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "TrainingTime"
  namespace           = "AWS/Personalize"
  period              = "3600"
  statistic           = "Maximum"
  threshold           = "24"
  alarm_description   = "Alerte si l'entraînement du modèle dure plus de 24 heures"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    SolutionArn = aws_personalize_dataset_group.main.arn
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-personalize-training-alarm"
  }
}
