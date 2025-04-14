variable "environment" {
  description = "Environnement de déploiement (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "Région AWS principale"
  type        = string
  default     = "eu-west-3"  # Paris
}

variable "vpc_cidr" {
  description = "CIDR du VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Liste des zones de disponibilité"
  type        = list(string)
  default     = ["eu-west-3a", "eu-west-3b", "eu-west-3c"]
}

variable "eks_cluster_version" {
  description = "Version du cluster EKS"
  type        = string
  default     = "1.27"
}

variable "eks_node_instance_types" {
  description = "Types d'instances pour les nœuds EKS"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "eks_desired_nodes" {
  description = "Nombre désiré de nœuds EKS"
  type        = number
  default     = 2
}

variable "eks_min_nodes" {
  description = "Nombre minimum de nœuds EKS"
  type        = number
  default     = 1
}

variable "eks_max_nodes" {
  description = "Nombre maximum de nœuds EKS"
  type        = number
  default     = 4
}

variable "documentdb_instance_class" {
  description = "Type d'instance DocumentDB"
  type        = string
  default     = "db.t3.medium"
}

variable "documentdb_instances" {
  description = "Nombre d'instances DocumentDB"
  type        = number
  default     = 2
}

variable "elasticache_node_type" {
  description = "Type de nœud ElastiCache"
  type        = string
  default     = "cache.t3.medium"
}

variable "elasticache_num_cache_nodes" {
  description = "Nombre de nœuds ElastiCache"
  type        = number
  default     = 2
}

variable "cloudfront_price_class" {
  description = "Classe de prix CloudFront"
  type        = string
  default     = "PriceClass_200"  # Europe, Amérique du Nord, Asie
}

variable "domain_name" {
  description = "Nom de domaine principal"
  type        = string
}

variable "alert_email" {
  description = "Email pour les alertes"
  type        = string
}

variable "backend_log_group" {
  description = "Groupe de logs CloudWatch pour le backend"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN du topic SNS pour les alertes"
  type        = string
}

variable "user_files_bucket_arn" {
  description = "ARN du bucket S3 pour les fichiers utilisateurs"
  type        = string
}

# Variables pour les tags communs
variable "tags" {
  description = "Tags communs à appliquer à toutes les ressources"
  type        = map(string)
  default     = {}
}

# Variables pour la sécurité
variable "allowed_ips" {
  description = "Liste des IPs autorisées pour l'accès admin"
  type        = list(string)
  default     = []
}

variable "ssl_certificate_arn" {
  description = "ARN du certificat SSL/TLS"
  type        = string
}

# Variables pour le monitoring
variable "retention_in_days" {
  description = "Durée de rétention des logs CloudWatch en jours"
  type        = number
  default     = 30
}

variable "monitoring_interval" {
  description = "Intervalle de monitoring en secondes"
  type        = number
  default     = 60
}

# Variables pour les backups
variable "backup_retention_period" {
  description = "Période de rétention des backups en jours"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Fenêtre de backup (UTC)"
  type        = string
  default     = "03:00-04:00"
}

# Variables pour le scaling
variable "autoscaling_target_cpu" {
  description = "Seuil CPU pour l'autoscaling (%)"
  type        = number
  default     = 70
}

variable "autoscaling_target_memory" {
  description = "Seuil mémoire pour l'autoscaling (%)"
  type        = number
  default     = 80
}
