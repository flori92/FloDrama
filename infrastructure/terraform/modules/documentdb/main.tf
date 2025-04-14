resource "aws_docdb_cluster" "main" {
  cluster_identifier      = var.cluster_name
  engine                 = "docdb"
  master_username        = var.master_username
  master_password        = var.master_password
  backup_retention_period = 7
  preferred_backup_window = "02:00-04:00"
  skip_final_snapshot    = true
  
  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.docdb.id]

  storage_encrypted     = true
  kms_key_id           = aws_kms_key.docdb.arn

  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_instance" "main" {
  count              = var.number_of_instances
  identifier         = "${var.cluster_name}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  auto_minor_version_upgrade = true
  
  tags = {
    Name        = "${var.cluster_name}-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_docdb_subnet_group" "main" {
  name       = "${var.cluster_name}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.cluster_name}-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "docdb" {
  name        = "${var.cluster_name}-sg"
  description = "Groupe de sécurité pour DocumentDB FloDrama"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
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
    Name        = "${var.cluster_name}-sg"
    Environment = var.environment
  }
}

resource "aws_kms_key" "docdb" {
  description             = "Clé KMS pour DocumentDB FloDrama"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.cluster_name}-kms"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "docdb" {
  name          = "alias/${var.cluster_name}-docdb"
  target_key_id = aws_kms_key.docdb.key_id
}

resource "aws_cloudwatch_metric_alarm" "docdb_cpu" {
  alarm_name          = "${var.cluster_name}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/DocDB"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "Alerte quand l'utilisation CPU dépasse 80%"
  alarm_actions      = [aws_sns_topic.docdb_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.main.cluster_identifier
  }

  tags = {
    Name        = "${var.cluster_name}-cpu-alarm"
    Environment = var.environment
  }
}

resource "aws_sns_topic" "docdb_alerts" {
  name = "${var.cluster_name}-alerts"

  tags = {
    Name        = "${var.cluster_name}-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_policy" "docdb_alerts" {
  arn = aws_sns_topic.docdb_alerts.arn

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
        Resource = aws_sns_topic.docdb_alerts.arn
      }
    ]
  })
}
