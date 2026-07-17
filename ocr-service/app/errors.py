from __future__ import annotations


class ApiError(Exception):
    """Raised anywhere in the request path; the app's exception handler renders it as the
    { success: false, message, errors } envelope with this status code."""

    def __init__(self, status_code: int, message: str, errors: list[str] | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.errors = errors or []
