terraform {
  required_version = ">= 1.0.0"

  backend "s3" {
    bucket         = "flodrama-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "eu-west-3"
    encrypt        = true
    dynamodb_table = "flodrama-terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "FloDrama"
      ManagedBy   = "Terraform"
    }
  }
}

# Configuration du VPC
module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets   = var.private_subnets
  public_subnets    = var.public_subnets
}

# Configuration EKS
module "eks" {
  source = "./modules/eks"

  cluster_name    = "flodrama-${var.environment}"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_types  = var.eks_instance_types
  min_size        = var.eks_min_size
  max_size        = var.eks_max_size
  desired_size    = var.eks_desired_size
  environment     = var.environment
}

# Configuration DocumentDB
module "documentdb" {
  source = "./modules/documentdb"

  cluster_name           = "flodrama-${var.environment}"
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  master_username       = var.documentdb_username
  master_password       = var.documentdb_password
  instance_class        = var.documentdb_instance_class
  number_of_instances   = var.documentdb_instances
  environment           = var.environment
}

# Configuration ElastiCache
module "elasticache" {
  source = "./modules/elasticache"

  cluster_name         = "flodrama-${var.environment}"
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  node_type           = var.elasticache_node_type
  number_of_replicas  = var.elasticache_replicas
  environment         = var.environment
}

# Configuration S3 et CloudFront pour le frontend
module "static_hosting" {
  source = "./modules/static_hosting"

  domain_name     = var.domain_name
  environment     = var.environment
  certificate_arn = module.dns.certificate_arn
}

# Configuration S3 et CloudFront pour les médias
module "media" {
  source = "./modules/media"

  domain_name     = "media.${var.domain_name}"
  environment     = var.environment
  certificate_arn = module.dns.certificate_arn
}

# Configuration Cognito pour l'authentification
module "cognito" {
  source = "./modules/cognito"

  user_pool_name  = "flodrama-${var.environment}"
  domain_name     = var.domain_name
  environment     = var.environment
}

# Configuration Amazon Personalize pour les recommandations
module "personalize" {
  source = "./modules/personalize"

  dataset_group_name = "flodrama-${var.environment}"
  environment        = var.environment
}

# Configuration de la surveillance avec CloudWatch
module "monitoring" {
  source = "./modules/monitoring"

  cluster_name    = "flodrama-${var.environment}"
  environment     = var.environment
  domain_name     = var.domain_name
}

# Configuration du pipeline de contenu
module "content_pipeline" {
  source = "./modules/content-pipeline"

  environment     = var.environment
  bucket_name     = "flodrama-${var.environment}-content"
}

# Configuration des domaines DNS
module "dns" {
  source = "./modules/dns"

  domain_name                    = var.domain_name
  environment                    = var.environment
  cloudfront_domain              = module.static_hosting.cloudfront_domain_name
  cloudfront_hosted_zone_id      = module.static_hosting.cloudfront_hosted_zone_id
  media_cloudfront_domain        = module.media.cloudfront_domain_name
  media_cloudfront_hosted_zone_id = module.media.cloudfront_hosted_zone_id
  
  # Configuration pour l'API (Load Balancer EKS)
  api_domain                     = module.eks.api_lb_dns_name
  api_hosted_zone_id             = module.eks.api_lb_zone_id
  
  # Configuration pour l'administration (Load Balancer EKS)
  admin_domain                   = module.eks.admin_lb_dns_name
  admin_hosted_zone_id           = module.eks.admin_lb_zone_id
  
  # Configuration pour les environnements de développement et staging (si applicable)
  dev_cloudfront_domain          = var.environment == "prod" ? var.dev_cloudfront_domain : ""
  dev_cloudfront_hosted_zone_id  = var.environment == "prod" ? var.dev_cloudfront_hosted_zone_id : ""
  staging_cloudfront_domain      = var.environment == "prod" ? var.staging_cloudfront_domain : ""
  staging_cloudfront_hosted_zone_id = var.environment == "prod" ? var.staging_cloudfront_hosted_zone_id : ""
  
  # Configuration des enregistrements MX et TXT
  mx_records                     = var.mx_records
  txt_records                    = var.txt_records
}

# Outputs
output "frontend_url" {
  description = "URL du frontend"
  value       = "https://${var.domain_name}"
}

output "api_url" {
  description = "URL de l'API"
  value       = "https://api.${var.domain_name}"
}

output "admin_url" {
  description = "URL de l'administration"
  value       = "https://admin.${var.domain_name}"
}

output "media_url" {
  description = "URL des médias"
  value       = "https://media.${var.domain_name}"
}

output "cognito_user_pool_id" {
  description = "ID du pool d'utilisateurs Cognito"
  value       = module.cognito.user_pool_id
}

output "cognito_app_client_id" {
  description = "ID du client d'application Cognito"
  value       = module.cognito.app_client_id
}

output "cloudfront_distribution_id" {
  description = "ID de la distribution CloudFront"
  value       = module.static_hosting.cloudfront_distribution_id
}

output "media_cloudfront_distribution_id" {
  description = "ID de la distribution CloudFront pour les médias"
  value       = module.media.cloudfront_distribution_id
}
