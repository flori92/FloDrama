/**
 * Variables globales pour l'infrastructure FloDrama
 */

variable "aws_region" {
  description = "Région AWS pour le déploiement"
  type        = string
  default     = "eu-west-3"  # Paris
}

variable "environment" {
  description = "Environnement de déploiement (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Variables VPC
variable "vpc_cidr" {
  description = "CIDR du VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zones de disponibilité à utiliser"
  type        = list(string)
  default     = ["eu-west-3a", "eu-west-3b", "eu-west-3c"]
}

variable "private_subnets" {
  description = "CIDRs des sous-réseaux privés"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDRs des sous-réseaux publics"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Variables EKS
variable "eks_instance_types" {
  description = "Types d'instances pour les nœuds EKS"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_min_size" {
  description = "Nombre minimum de nœuds EKS"
  type        = number
  default     = 2
}

variable "eks_max_size" {
  description = "Nombre maximum de nœuds EKS"
  type        = number
  default     = 5
}

variable "eks_desired_size" {
  description = "Nombre souhaité de nœuds EKS"
  type        = number
  default     = 3
}

# Variables DocumentDB
variable "documentdb_username" {
  description = "Nom d'utilisateur pour DocumentDB"
  type        = string
  default     = "flodrama_admin"
  sensitive   = true
}

variable "documentdb_password" {
  description = "Mot de passe pour DocumentDB"
  type        = string
  sensitive   = true
}

variable "documentdb_instance_class" {
  description = "Classe d'instance pour DocumentDB"
  type        = string
  default     = "db.t3.medium"
}

variable "documentdb_instances" {
  description = "Nombre d'instances DocumentDB"
  type        = number
  default     = 1
}

# Variables ElastiCache
variable "elasticache_node_type" {
  description = "Type de nœud pour ElastiCache"
  type        = string
  default     = "cache.t3.small"
}

variable "elasticache_replicas" {
  description = "Nombre de réplicas pour ElastiCache"
  type        = number
  default     = 1
}

# Variables de domaine
variable "domain_name" {
  description = "Nom de domaine principal pour FloDrama"
  type        = string
}

variable "dev_cloudfront_domain" {
  description = "Nom de domaine CloudFront pour l'environnement de développement"
  type        = string
  default     = ""
}

variable "dev_cloudfront_hosted_zone_id" {
  description = "ID de la zone hébergée CloudFront pour l'environnement de développement"
  type        = string
  default     = ""
}

variable "staging_cloudfront_domain" {
  description = "Nom de domaine CloudFront pour l'environnement de staging"
  type        = string
  default     = ""
}

variable "staging_cloudfront_hosted_zone_id" {
  description = "ID de la zone hébergée CloudFront pour l'environnement de staging"
  type        = string
  default     = ""
}

variable "mx_records" {
  description = "Enregistrements MX pour le domaine"
  type        = list(string)
  default     = ["10 mail.flodrama.com"]
}

variable "txt_records" {
  description = "Enregistrements TXT pour le domaine (SPF, DKIM, etc.)"
  type        = list(string)
  default     = ["v=spf1 include:_spf.google.com ~all"]
}
