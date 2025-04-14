/**
 * Module de gestion des domaines pour FloDrama
 * 
 * Ce module gère les domaines existants sur AWS Route53 et les configure
 * pour pointer vers les différents services de l'infrastructure FloDrama.
 */

# Zone hébergée principale
data "aws_route53_zone" "main" {
  name = var.domain_name
  private_zone = false
}

# Enregistrement A pour le domaine principal pointant vers CloudFront
resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Enregistrement A pour le sous-domaine www pointant vers CloudFront
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Enregistrement A pour l'API pointant vers le load balancer EKS
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.api_domain
    zone_id                = var.api_hosted_zone_id
    evaluate_target_health = true
  }
}

# Enregistrement A pour le sous-domaine admin pointant vers le load balancer EKS
resource "aws_route53_record" "admin" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "admin.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.admin_domain
    zone_id                = var.admin_hosted_zone_id
    evaluate_target_health = true
  }
}

# Enregistrement A pour le sous-domaine media pointant vers CloudFront Media
resource "aws_route53_record" "media" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "media.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.media_cloudfront_domain
    zone_id                = var.media_cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Configuration des certificats SSL pour les sous-domaines
resource "aws_acm_certificate" "wildcard" {
  domain_name               = "*.${var.domain_name}"
  validation_method         = "DNS"
  subject_alternative_names = [var.domain_name]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.domain_name}-wildcard-cert"
    Environment = var.environment
  }
}

# Validation du certificat SSL
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Attendre la validation du certificat
resource "aws_acm_certificate_validation" "wildcard" {
  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Configuration des enregistrements MX pour le courrier électronique
resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 300
  records = var.mx_records
}

# Configuration des enregistrements TXT pour SPF, DKIM, etc.
resource "aws_route53_record" "txt" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 300
  records = var.txt_records
}

# Sous-domaines supplémentaires pour les environnements de développement et de test
resource "aws_route53_record" "dev" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "dev.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.dev_cloudfront_domain
    zone_id                = var.dev_cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "staging" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "staging.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.staging_cloudfront_domain
    zone_id                = var.staging_cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "certificate_arn" {
  description = "ARN du certificat SSL wildcard"
  value       = aws_acm_certificate.wildcard.arn
}

output "domain_name" {
  description = "Nom de domaine principal"
  value       = var.domain_name
}

output "api_domain" {
  description = "Domaine de l'API"
  value       = "api.${var.domain_name}"
}

output "admin_domain" {
  description = "Domaine de l'administration"
  value       = "admin.${var.domain_name}"
}

output "media_domain" {
  description = "Domaine des médias"
  value       = "media.${var.domain_name}"
}
