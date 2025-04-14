resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = var.cluster_name
  replication_group_description = "Groupe de réplication Redis pour FloDrama"
  node_type                     = var.node_type
  number_cache_clusters         = var.number_of_replicas
  port                         = 6379
  
  parameter_group_name          = aws_elasticache_parameter_group.main.name
  subnet_group_name            = aws_elasticache_subnet_group.main.name
  security_group_ids           = [aws_security_group.redis.id]

  automatic_failover_enabled    = true
  multi_az_enabled             = true
  
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                  = var.auth_token

  maintenance_window           = "tue:02:00-tue:03:00"
  snapshot_window             = "03:00-04:00"
  snapshot_retention_limit    = 7

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
  }
}

resource "aws_elasticache_parameter_group" "main" {
  family = "redis6.x"
  name   = "${var.cluster_name}-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = {
    Name        = "${var.cluster_name}-params"
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.cluster_name}-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.cluster_name}-redis-sg"
  description = "Groupe de sécurité pour Redis FloDrama"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.eks_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.cluster_name}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Alerte quand l'utilisation CPU dépasse 75%"
  alarm_actions       = [aws_sns_topic.redis_alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = {
    Name        = "${var.cluster_name}-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.cluster_name}-redis-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000" # 100MB
  alarm_description   = "Alerte quand la mémoire disponible est inférieure à 100MB"
  alarm_actions       = [aws_sns_topic.redis_alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = {
    Name        = "${var.cluster_name}-memory-alarm"
    Environment = var.environment
  }
}

resource "aws_sns_topic" "redis_alerts" {
  name = "${var.cluster_name}-redis-alerts"

  tags = {
    Name        = "${var.cluster_name}-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_policy" "redis_alerts" {
  arn = aws_sns_topic.redis_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.redis_alerts.arn
      }
    ]
  })
}
