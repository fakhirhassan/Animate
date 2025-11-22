#!/usr/bin/env python3
"""
Download Pre-trained Model Weights
Downloads the required model weights for 2D to 3D conversion.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model download URLs (placeholders - replace with actual URLs)
MODEL_URLS = {
    'midas_small': {
        'url': 'https://github.com/isl-org/MiDaS/releases/download/v3/midas_v21_small_256.pt',
        'filename': 'midas_v21_small_256.pt',
        'size_mb': 50
    },
    'midas_hybrid': {
        'url': 'https://github.com/isl-org/MiDaS/releases/download/v3_1/dpt_swin2_tiny_256.pt',
        'filename': 'dpt_swin2_tiny_256.pt',
        'size_mb': 160
    }
}

# Default model directory
DEFAULT_MODEL_DIR = Path(__file__).parent.parent / 'models' / 'two_d_to_three_d' / 'model_weights'


def download_file(url: str, dest_path: Path, show_progress: bool = True) -> bool:
    """
    Download a file from URL.

    Args:
        url: Download URL
        dest_path: Destination file path
        show_progress: Whether to show download progress

    Returns:
        True if successful
    """
    try:
        import urllib.request

        logger.info(f'Downloading: {url}')
        logger.info(f'Destination: {dest_path}')

        def progress_hook(count, block_size, total_size):
            if show_progress and total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                sys.stdout.write(f'\rProgress: {percent}%')
                sys.stdout.flush()

        urllib.request.urlretrieve(url, dest_path, reporthook=progress_hook)

        if show_progress:
            print()  # New line after progress

        logger.info('Download complete!')
        return True

    except Exception as e:
        logger.error(f'Download failed: {str(e)}')
        return False


def download_with_requests(url: str, dest_path: Path) -> bool:
    """
    Download using requests library (better progress tracking).

    Args:
        url: Download URL
        dest_path: Destination path

    Returns:
        True if successful
    """
    try:
        import requests
        from tqdm import tqdm

        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with open(dest_path, 'wb') as f:
            with tqdm(total=total_size, unit='B', unit_scale=True, desc=dest_path.name) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))

        return True

    except ImportError:
        logger.info('requests/tqdm not available, using urllib')
        return download_file(url, dest_path)

    except Exception as e:
        logger.error(f'Download failed: {str(e)}')
        return False


def download_model(model_name: str, model_dir: Path) -> bool:
    """
    Download a specific model.

    Args:
        model_name: Name of model to download
        model_dir: Directory to save model

    Returns:
        True if successful
    """
    if model_name not in MODEL_URLS:
        logger.error(f'Unknown model: {model_name}')
        logger.info(f'Available models: {", ".join(MODEL_URLS.keys())}')
        return False

    model_info = MODEL_URLS[model_name]
    dest_path = model_dir / model_info['filename']

    # Check if already exists
    if dest_path.exists():
        logger.info(f'Model already exists: {dest_path}')
        return True

    # Create directory if needed
    model_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f'Downloading {model_name} (~{model_info["size_mb"]}MB)...')

    return download_with_requests(model_info['url'], dest_path)


def download_all_models(model_dir: Path) -> dict:
    """
    Download all available models.

    Args:
        model_dir: Directory to save models

    Returns:
        Dictionary of model names to success status
    """
    results = {}

    for model_name in MODEL_URLS:
        results[model_name] = download_model(model_name, model_dir)

    return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Download pre-trained models for AniMate'
    )
    parser.add_argument(
        '--model',
        type=str,
        choices=list(MODEL_URLS.keys()) + ['all'],
        default='midas_small',
        help='Model to download (default: midas_small)'
    )
    parser.add_argument(
        '--dir',
        type=Path,
        default=DEFAULT_MODEL_DIR,
        help='Directory to save models'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='List available models'
    )

    args = parser.parse_args()

    if args.list:
        print('\nAvailable models:')
        print('-' * 50)
        for name, info in MODEL_URLS.items():
            print(f'  {name}:')
            print(f'    File: {info["filename"]}')
            print(f'    Size: ~{info["size_mb"]}MB')
        return

    logger.info('AniMate Model Downloader')
    logger.info(f'Model directory: {args.dir}')

    if args.model == 'all':
        results = download_all_models(args.dir)
        print('\nDownload Summary:')
        for model, success in results.items():
            status = '✓' if success else '✗'
            print(f'  {status} {model}')
    else:
        success = download_model(args.model, args.dir)
        if success:
            print(f'\n✓ Successfully downloaded {args.model}')
        else:
            print(f'\n✗ Failed to download {args.model}')
            sys.exit(1)


if __name__ == '__main__':
    main()
