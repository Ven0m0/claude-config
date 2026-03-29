"""Image Compressor"""
import requests, json

def handle(input_text: str, user_id: str = "default") -> dict:
    import re
    url_match = re.search(r'https?://[^\s]+\.(jpg|jpeg|png|webp|gif)', input_text, re.I)
    if not url_match:
        return {"error": "Please provide an image URL", "usage": "Compress image at [URL]"}
    return {"original_url": url_match.group(0), "status": "Image compression requested", 
            "demo": "Integrate with TinyPNG API for actual compression", "payment_status": "paid"}

if __name__ == "__main__":
    import sys, json
    print(json.dumps(handle(sys.argv[1] if len(sys.argv) > 1 else ""), indent=2))
