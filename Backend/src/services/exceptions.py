"""
Exceptions personnalisées pour le service de scraping
"""

class ScrapingError(Exception):
    """Exception de base pour les erreurs de scraping"""
    def __init__(self, message: str, source: str = None, url: str = None):
        self.message = message
        self.source = source
        self.url = url
        super().__init__(self.message)

class SourceNotSupportedError(ScrapingError):
    """Levée quand la source de streaming n'est pas supportée"""
    pass

class ContentNotFoundError(ScrapingError):
    """Levée quand le contenu n'est pas trouvé"""
    pass

class InvalidStreamingUrlError(ScrapingError):
    """Levée quand l'URL de streaming n'est pas valide"""
    pass

class RateLimitExceededError(ScrapingError):
    """Levée quand la limite de requêtes est dépassée"""
    pass

class MetadataValidationError(ScrapingError):
    """Levée quand les métadonnées ne sont pas valides"""
    def __init__(self, message: str, validation_errors: dict, **kwargs):
        self.validation_errors = validation_errors
        super().__init__(message, **kwargs)

class NetworkError(ScrapingError):
    """Levée pour les erreurs réseau"""
    def __init__(self, message: str, status_code: int = None, **kwargs):
        self.status_code = status_code
        super().__init__(message, **kwargs)

class ParsingError(ScrapingError):
    """Levée pour les erreurs de parsing HTML"""
    def __init__(self, message: str, selector: str = None, **kwargs):
        self.selector = selector
        super().__init__(message, **kwargs)

class CacheError(ScrapingError):
    """Levée pour les erreurs de cache"""
    pass

class DatabaseError(ScrapingError):
    """Levée pour les erreurs de base de données"""
    pass
