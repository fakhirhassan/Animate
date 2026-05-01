"""
Download all required AI models to D:\HuggingFace (not C:).
Run with: venv/Scripts/python download_models.py
"""
import os
import sys

# Force HuggingFace to use D: drive BEFORE any hf imports
os.environ["HF_HOME"] = r"D:\HuggingFace"
os.environ["HUGGINGFACE_HUB_CACHE"] = r"D:\HuggingFace\hub"

from huggingface_hub import snapshot_download, constants

print(f"Models will download to: {constants.HF_HUB_CACHE}")
print()

models = [
    ("Wan-AI/Wan2.1-T2V-1.3B-Diffusers", "~5.5GB — fast T2V, required"),
    ("Wan-AI/Wan2.2-TI2V-5B",             "~10GB  — T2V + I2V chaining, recommended (RTX A4000 has 15GB)"),
]

for model_id, note in models:
    print(f"Downloading {model_id}  ({note})")
    try:
        path = snapshot_download(model_id, resume_download=True)
        print(f"  Done → {path}\n")
    except Exception as e:
        print(f"  ERROR: {e}\n")

print("All downloads complete.")
print(f"Models stored in: {constants.HF_HUB_CACHE}")
