/**
 * Variables pour le module DNS de FloDrama
 */

variable "domain_name" {
  description = "Nom de domaine principal pour FloDrama"
  type        = string
}

variable "environment" {
  description = "Environnement de déploiement (dev, staging, prod)"
  type        = string
}

variable "cloudfront_domain" {
  description = "Nom de domaine de la distribution CloudFront pour le frontend"
  type        = string
}

variable "cloudfront_hosted_zone_id" {
  description = "ID de la zone hébergée CloudFront pour le frontend"
  type        = string
}

variable "api_domain" {
  description = "Nom de domaine du load balancer pour l'API"
  type        = string
  default     = ""
}

variable "api_hosted_zone_id" {
  description = "ID de la zone hébergée du load balancer pour l'API"
  type        = string
  default     = ""
}

variable "admin_domain" {
  description = "Nom de domaine du load balancer pour l'administration"
  type        = string
  default     = ""
}

variable "admin_hosted_zone_id" {
  description = "ID de la zone hébergée du load balancer pour l'administration"
  type        = string
  default     = ""
}

variable "media_cloudfront_domain" {
  description = "Nom de domaine de la distribution CloudFront pour les médias"
  type        = string
  default     = ""
}

variable "media_cloudfront_hosted_zone_id" {
  description = "ID de la zone hébergée CloudFront pour les médias"
  type        = string
  default     = ""
}

variable "dev_cloudfront_domain" {
  description = "Nom de domaine de la distribution CloudFront pour l'environnement de développement"
  type        = string
  default     = ""
}

variable "dev_cloudfront_hosted_zone_id" {
  description = "ID de la zone hébergée CloudFront pour l'environnement de développement"
  type        = string
  default     = ""
}

variable "staging_cloudfront_domain" {
  description = "Nom de domaine de la distribution CloudFront pour l'environnement de staging"
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
