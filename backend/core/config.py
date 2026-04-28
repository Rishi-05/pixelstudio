from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Security
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Database
    database_url: str = "sqlite+aiosqlite:///./pixelstudio.db"

    # ComfyUI
    comfy_host: str = "127.0.0.1"
    comfy_port: int = 8188

    # Storage
    comfy_output_dir: str = "../ComfyUI/output"
    images_dir: str = "./images"

    # CORS
    frontend_origin: str = "http://localhost:5173"

    @property
    def comfy_base_url(self) -> str:
        # If host is a cloudflare/remote domain (no port needed), use https
        host = self.comfy_host
        if "trycloudflare.com" in host or "ngrok" in host or host.startswith("http"):
            # Strip any accidental http:// prefix
            host = host.replace("https://", "").replace("http://", "")
            return f"https://{host}"
        # Local ComfyUI
        return f"http://{host}:{self.comfy_port}"

    @property
    def comfy_ws_url(self) -> str:
        host = self.comfy_host
        if "trycloudflare.com" in host or "ngrok" in host or host.startswith("http"):
            host = host.replace("https://", "").replace("http://", "")
            return f"wss://{host}/ws"
        return f"ws://{host}:{self.comfy_port}/ws"


@lru_cache
def get_settings() -> Settings:
    return Settings()
