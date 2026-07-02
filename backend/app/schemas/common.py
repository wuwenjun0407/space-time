from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    code: int = 0
    message: str = "ok"
    data: Optional[T] = None


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int


def ok(data=None, message: str = "ok"):
    return {"code": 0, "message": message, "data": data}
