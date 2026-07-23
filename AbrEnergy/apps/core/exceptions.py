from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        errors = response.data
        response.data = {
            "status": response.status_code,
            "errors": errors,
        }
    return response
