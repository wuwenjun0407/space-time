class AppException(Exception):
    """统一业务异常，code 对应错误码表，全局 handler 输出 {code, message}。"""

    def __init__(self, code: int = 40000, message: str = "请求错误", http_status: int = 400):
        self.code = code
        self.message = message
        self.http_status = http_status
        super().__init__(message)


class AuthError(AppException):
    def __init__(self, message: str = "未授权"):
        super().__init__(code=40100, message=message, http_status=401)


class ForbiddenError(AppException):
    def __init__(self, message: str = "无权限"):
        super().__init__(code=40300, message=message, http_status=403)


class NotFoundError(AppException):
    def __init__(self, message: str = "资源不存在"):
        super().__init__(code=40400, message=message, http_status=404)


class ConflictError(AppException):
    def __init__(self, message: str = "资源冲突"):
        super().__init__(code=40900, message=message, http_status=409)
