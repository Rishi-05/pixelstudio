"""
comfy_client.py
Thin async wrapper around ComfyUI's REST + WebSocket API.
Supports both local and remote (Colab/cloudflare) ComfyUI instances.
"""
import asyncio
import json
import uuid
from typing import Callable

import httpx
import websockets

from core.config import get_settings

settings = get_settings()


# ── Default SD 1.5 workflow ───────────────────────────────────────────────────

def build_workflow(
    positive: str,
    negative: str,
    width: int = 512,
    height: int = 512,
    steps: int = 20,
    cfg: float = 7.0,
    sampler: str = "dpmpp_2m",
    seed: int = -1,
    checkpoint: str = "v1-5-pruned-emaonly.safetensors",
) -> dict:
    if seed == -1:
        import random
        seed = random.randint(0, 2**32 - 1)

    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": checkpoint},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": positive, "clip": ["4", 1]},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative, "clip": ["4", 1]},
        },
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler,
                "scheduler": "normal",
                "denoise": 1.0,
            },
        },
        "9": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["8", 0], "vae": ["4", 2]},
        },
        "10": {
            "class_type": "SaveImage",
            "inputs": {"images": ["9", 0], "filename_prefix": "pixelstudio"},
        },
    }


# ── ComfyUI HTTP + WebSocket client ───────────────────────────────────────────

class ComfyClient:
    def __init__(self):
        self.client_id = str(uuid.uuid4())

    @property
    def base_url(self):
        return settings.comfy_base_url

    @property
    def ws_url(self):
        return settings.comfy_ws_url

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                r = await client.get(f"{self.base_url}/system_stats")
                return r.status_code == 200
        except Exception:
            return False

    async def queue_prompt(self, workflow: dict) -> str:
        payload = {"prompt": workflow, "client_id": self.client_id}
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.post(f"{self.base_url}/prompt", json=payload)
            r.raise_for_status()
            return r.json()["prompt_id"]

    async def get_history(self, prompt_id: str) -> dict:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(f"{self.base_url}/history/{prompt_id}")
            r.raise_for_status()
            return r.json()

    async def download_image(self, filename: str, subfolder: str = "", dest_path: str = "") -> bool:
        """
        Download the generated image from ComfyUI (works for both local and remote).
        Saves to dest_path on local disk.
        """
        params = {"filename": filename, "subfolder": subfolder, "type": "output"}
        try:
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                r = await client.get(f"{self.base_url}/view", params=params)
                r.raise_for_status()
                with open(dest_path, "wb") as f:
                    f.write(r.content)
            return True
        except Exception as e:
            print(f"Image download error: {e}")
            return False

    async def stream_progress(
        self,
        prompt_id: str,
        on_progress: Callable[[int], None],
    ) -> dict | None:
        """
        Connect to ComfyUI WebSocket, stream progress 0-100 via callback.
        Returns image info dict {"filename": ..., "subfolder": ...} when done.
        """
        ws_url = f"{self.ws_url}?clientId={self.client_id}"
        image_info = None

        try:
            async with websockets.connect(ws_url, ping_interval=20, ping_timeout=30) as ws:
                async for raw in ws:
                    # ComfyUI sends both text (JSON) and binary (preview) frames
                    if isinstance(raw, bytes):
                        continue

                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue

                    msg_type = msg.get("type")

                    if msg_type == "progress":
                        data = msg.get("data", {})
                        step = data.get("value", 0)
                        total = data.get("max", 1)
                        pct = int(step / total * 95)
                        await on_progress(pct)

                    elif msg_type == "executed":
                        data = msg.get("data", {})
                        if data.get("prompt_id") == prompt_id:
                            output = data.get("output", {})
                            images = output.get("images", [])
                            if images:
                                image_info = images[0]  # {"filename": ..., "subfolder": ..., "type": ...}
                            await on_progress(100)
                            break

                    elif msg_type == "execution_error":
                        data = msg.get("data", {})
                        if data.get("prompt_id") == prompt_id:
                            raise RuntimeError(data.get("exception_message", "ComfyUI error"))

                    elif msg_type == "execution_cached":
                        # Job was cached — fetch from history
                        pass

        except Exception as exc:
            raise RuntimeError(f"ComfyUI WebSocket error: {exc}") from exc

        # Fallback: if websocket missed the 'executed' event, poll history
        if not image_info:
            print("WebSocket missed executed event, falling back to history poll...")
            for _ in range(60):
                await asyncio.sleep(2)
                try:
                    history = await self.get_history(prompt_id)
                    if prompt_id in history:
                        outputs = history[prompt_id].get("outputs", {})
                        for node_output in outputs.values():
                            imgs = node_output.get("images", [])
                            if imgs:
                                image_info = imgs[0]
                                await on_progress(100)
                                break
                    if image_info:
                        break
                except Exception:
                    pass

        return image_info


# Singleton
comfy_client = ComfyClient()
