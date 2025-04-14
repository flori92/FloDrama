resource "aws_s3_bucket" "media_input" {
  bucket = "flodrama-${var.environment}-media-input"

  tags = {
    Name        = "flodrama-${var.environment}-media-input"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "media_output" {
  bucket = "flodrama-${var.environment}-media-output"

  tags = {
    Name        = "flodrama-${var.environment}-media-output"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "media_input" {
  bucket = aws_s3_bucket.media_input.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "media_output" {
  bucket = aws_s3_bucket.media_output.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_mediastore_container" "streaming" {
  name = "flodrama-${var.environment}-streaming"

  tags = {
    Name        = "flodrama-${var.environment}-streaming"
    Environment = var.environment
  }
}

resource "aws_mediaconvert_queue" "main" {
  name = "flodrama-${var.environment}-queue"
  pricing_plan = "ON_DEMAND"
  
  tags = {
    Name        = "flodrama-${var.environment}-queue"
    Environment = var.environment
  }
}

resource "aws_iam_role" "mediaconvert" {
  name = "flodrama-${var.environment}-mediaconvert-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "mediaconvert.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "flodrama-${var.environment}-mediaconvert-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "mediaconvert" {
  name = "flodrama-${var.environment}-mediaconvert-policy"
  role = aws_iam_role.mediaconvert.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.media_input.arn}/*",
          "${aws_s3_bucket.media_output.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "mediastore:PutObject",
          "mediastore:GetObject",
          "mediastore:ListContainers"
        ]
        Resource = [
          aws_mediastore_container.streaming.arn,
          "${aws_mediastore_container.streaming.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["*"]
      }
    ]
  })
}

resource "aws_mediaconvert_preset" "hls_1080p" {
  name        = "flodrama-${var.environment}-hls-1080p"
  description = "Preset HLS 1080p pour FloDrama"
  
  settings = jsonencode({
    ContainerSettings = {
      Container = "M3U8"
      M3u8Settings = {
        AudioFramesPerPes = 4
        PcrControl = "PCR_EVERY_PES_PACKET"
        PmtPid = 480
        PrivateMetadataPid = 503
        ProgramNumber = 1
        PatInterval = 0
        PmtInterval = 0
        VideoPid = 481
      }
    }
    VideoDescription = {
      Width = 1920
      Height = 1080
      CodecSettings = {
        Codec = "H_264"
        H264Settings = {
          RateControlMode = "QVBR"
          QvbrSettings = {
            QvbrQualityLevel = 8
          }
          MaxBitrate = 6000000
          GopSize = 90
          GopSizeUnits = "FRAMES"
          ParControl = "INITIALIZE_FROM_SOURCE"
          NumberReferenceFrames = 3
          EntropyEncoding = "CABAC"
          FramerateControl = "INITIALIZE_FROM_SOURCE"
          CodecProfile = "HIGH"
          CodecLevel = "AUTO"
          QualityTuningLevel = "MULTI_PASS_HQ"
          FlickerAdaptiveQuantization = "ENABLED"
          SceneChangeDetect = "ENABLED"
          TemporalAq = "ENABLED"
          SpatialAq = "ENABLED"
        }
      }
    }
    AudioDescriptions = [
      {
        CodecSettings = {
          Codec = "AAC"
          AacSettings = {
            Bitrate = 192000
            CodingMode = "CODING_MODE_2_0"
            SampleRate = 48000
          }
        }
      }
    ]
  })

  tags = {
    Name        = "flodrama-${var.environment}-hls-1080p"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "mediaconvert_errors" {
  alarm_name          = "flodrama-${var.environment}-mediaconvert-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/MediaConvert"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alerte en cas d'erreurs de transcodage"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    Queue = aws_mediaconvert_queue.main.name
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-mediaconvert-errors-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "mediastore_latency" {
  alarm_name          = "flodrama-${var.environment}-mediastore-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestLatency"
  namespace           = "AWS/MediaStore"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alerte si la latence dépasse 1 seconde"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    Container = aws_mediastore_container.streaming.name
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-mediastore-latency-alarm"
  }
}
