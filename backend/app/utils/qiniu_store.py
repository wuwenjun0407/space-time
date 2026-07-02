import uuid

from qiniu import Auth

from app.core.config import settings

_auth_cache = None


def _get_auth() -> Auth:
    global _auth_cache
    if _auth_cache is None:
        _auth_cache = Auth(settings.QINIU_ACCESS_KEY,
                           settings.QINIU_SECRET_KEY)
    return _auth_cache


def build_key(group_id, category_id, ext: str) -> str:
    cat = str(category_id) if category_id else "default"
    return f"{group_id}/{cat}/{uuid.uuid4().hex}.{ext.lstrip('.')}"


def upload_token(key: str, file_type: str) -> str:
    callback_body = (
        '{"key":"$(key)","fsize":$(fsize),"mimeType":"$(mimeType)",'
        '"w":$(imageInfo.width),"h":$(imageInfo.height)}'
    )
    policy = {
        "callbackUrl": settings.QINIU_CALLBACK_URL,
        "callbackBody": callback_body,
        "callbackBodyType": "application/json",
    }
    return _get_auth().upload_token(settings.QINIU_BUCKET, key, settings.QINIU_TOKEN_EXPIRES, policy)


def private_url(key: str | None, expires: int = 3600) -> str | None:
    if not key:
        return None
    base = f"http://{settings.QINIU_DOMAIN}/{key}"
    return _get_auth().private_download_url(base, expires=expires)


def verify_callback(auth_header: str, body: bytes) -> bool:
    return _get_auth().verify_callback(
        origin_authorization=auth_header,
        url=settings.QINIU_CALLBACK_URL,
        body=body.decode(),
    )
