import base64
import random
import string
import uuid
from io import BytesIO

from captcha.image import ImageCaptcha

from app.core.config import settings

_image = ImageCaptcha(width=140, height=48)


def generate_captcha() -> tuple[str, str, str]:
    """返回 (captcha_key, code, base64_data_url)。"""
    code = "".join(random.choices(string.ascii_uppercase +
                   string.digits, k=settings.CAPTCHA_LENGTH))
    captcha_key = str(uuid.uuid4())
    buf = BytesIO()
    _image.write(code, buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return captcha_key, code, f"data:image/png;base64,{b64}"
