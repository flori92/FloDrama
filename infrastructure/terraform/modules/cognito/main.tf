resource "aws_cognito_user_pool" "flodrama" {
  name = "flodrama-${var.environment}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase               = true
    require_numbers                 = true
    require_symbols                 = true
    require_uppercase               = true
    temporary_password_validity_days = 7
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject       = "Confirmation de votre compte FloDrama"
    email_message       = "Votre code de confirmation est {####}"
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable            = true

    string_attribute_constraints {
      min_length = 3
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "preferred_username"
    required            = false
    mutable            = true

    string_attribute_constraints {
      min_length = 3
      max_length = 256
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "web_client" {
  name                = "flodrama-${var.environment}-web-client"
  user_pool_id        = aws_cognito_user_pool.flodrama.id
  
  generate_secret     = false
  
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  allowed_oauth_flows = ["implicit", "code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes = ["email", "openid", "profile"]
  
  callback_urls = ["https://flodrama.com/auth/callback"]
  logout_urls   = ["https://flodrama.com"]

  supported_identity_providers = ["COGNITO"]

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "auth-${var.environment}-flodrama"
  user_pool_id = aws_cognito_user_pool.flodrama.id
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "flodrama_${var.environment}_identity_pool"

  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.web_client.id
    provider_name           = aws_cognito_user_pool.flodrama.endpoint
    server_side_token_check = false
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-identity-pool"
  }
}

resource "aws_iam_role" "authenticated" {
  name = "flodrama-${var.environment}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-authenticated-role"
  }
}

resource "aws_iam_role_policy" "authenticated" {
  name = "flodrama-${var.environment}-authenticated-policy"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${var.user_files_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "cognito_failed_auth" {
  alarm_name          = "flodrama-${var.environment}-failed-auth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FailedAuthentication"
  namespace           = "AWS/Cognito"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alerte quand il y a trop d'authentifications échouées"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    UserPoolId = aws_cognito_user_pool.flodrama.id
  }

  tags = {
    Environment = var.environment
    Name        = "flodrama-${var.environment}-failed-auth-alarm"
  }
}
