resource "aws_cloudwatch_dashboard" "flodrama" {
  dashboard_name = "flodrama-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "flodrama-api", { "stat" : "Sum" }],
            [".", "Latency", ".", ".", { "stat" : "Average" }],
            [".", "4XXError", ".", ".", { "stat" : "Sum" }],
            [".", "5XXError", ".", ".", { "stat" : "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "flodrama-backend", { "stat" : "Average" }],
            [".", "MemoryUtilization", ".", ".", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "flodrama-redis", { "stat" : "Average" }],
            [".", "FreeableMemory", ".", ".", { "stat" : "Average" }],
            [".", "CacheHits", ".", ".", { "stat" : "Sum" }],
            [".", "CacheMisses", ".", ".", { "stat" : "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Redis Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id, { "stat" : "Sum" }],
            [".", "TotalErrorRate", ".", ".", { "stat" : "Average" }],
            [".", "BytesDownloaded", ".", ".", { "stat" : "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "flodrama-${var.environment}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alerte si la latence API dépasse 1 seconde"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "flodrama-api"
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-api-latency-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "flodrama-${var.environment}-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alerte si plus de 10 erreurs 5XX en 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "flodrama-api"
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-error-rate-alarm"
  }
}

resource "aws_sns_topic" "alerts" {
  name = "flodrama-${var.environment}-alerts"

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-alerts"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_metric_filter" "backend_errors" {
  name           = "flodrama-${var.environment}-backend-errors"
  pattern        = "[timestamp, requestId, level = ERROR, ...]"
  log_group_name = var.backend_log_group

  metric_transformation {
    name          = "BackendErrors"
    namespace     = "FloDrama/Backend"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_errors" {
  alarm_name          = "flodrama-${var.environment}-backend-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BackendErrors"
  namespace           = "FloDrama/Backend"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alerte si plus de 5 erreurs backend en 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-backend-errors-alarm"
  }
}

resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "flodrama-${var.environment}-error-analysis"

  log_group_names = [var.backend_log_group]

  query_string = <<EOF
fields @timestamp, @message
| filter level = "ERROR"
| stats count(*) as error_count by error_type
| sort error_count desc
EOF
}

resource "aws_cloudwatch_dashboard" "performance" {
  dashboard_name = "flodrama-${var.environment}-performance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["FloDrama/Backend", "ResponseTime", "Endpoint", "/api/recommendations", { "stat" : "Average" }],
            [".", ".", ".", "/api/content", { "stat" : "Average" }],
            [".", ".", ".", "/api/auth", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Response Times"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["FloDrama/Backend", "CacheHitRate", { "stat" : "Average" }],
            [".", "DatabaseQueryTime", { "stat" : "Average" }],
            [".", "RecommendationComputeTime", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Performance Metrics"
        }
      }
    ]
  })
}
