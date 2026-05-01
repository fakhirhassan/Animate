"""
One-shot cleanup for orphaned upload files.

Orphans are files in uploads/input or uploads/output whose job_id doesn't
exist in the `conversions` table. These accumulate from failed/aborted jobs
and pre-DB-tracking conversions.

Usage:
    python scripts/cleanup_uploads.py              # dry-run — lists what would be deleted
    python scripts/cleanup_uploads.py --delete     # actually delete
    python scripts/cleanup_uploads.py --older-than 30  # only files older than N days
"""

import argparse
import os
import sys
import time
from pathlib import Path

# Make backend/ importable when run from project root or from backend/
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from dotenv import load_dotenv
load_dotenv(_HERE.parent / ".env")

from supabase_client.supabase_config import get_supabase


UPLOAD_ROOT = _HERE.parent / "uploads"
INPUT_DIR = UPLOAD_ROOT / "input"
OUTPUT_DIR = UPLOAD_ROOT / "output"


def get_known_job_ids() -> set[str]:
    """Fetch all conversion job IDs from the database."""
    supabase = get_supabase()
    result = supabase.table("conversions").select("id").execute()
    return {row["id"] for row in (result.data or [])}


def scan_folder(folder: Path, known_ids: set[str], older_than_days: int = 0):
    """Return (orphans, kept) as lists of (path, size_bytes)."""
    orphans = []
    kept = []
    cutoff = time.time() - older_than_days * 86400 if older_than_days > 0 else None

    if not folder.exists():
        return orphans, kept

    for entry in folder.iterdir():
        if not entry.is_file():
            continue
        # Job ID is the filename stem before the first dot (UUID format)
        stem = entry.stem
        size = entry.stat().st_size
        mtime = entry.stat().st_mtime

        is_orphan = stem not in known_ids
        if cutoff is not None and mtime > cutoff:
            # Too new — skip even if orphan
            kept.append((entry, size))
            continue

        if is_orphan:
            orphans.append((entry, size))
        else:
            kept.append((entry, size))

    return orphans, kept


def human(n_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if n_bytes < 1024:
            return f"{n_bytes:.1f} {unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f} TB"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--delete", action="store_true", help="Actually delete files")
    parser.add_argument("--older-than", type=int, default=0, help="Only files older than N days")
    args = parser.parse_args()

    print(f"Scanning {UPLOAD_ROOT}...")
    try:
        known_ids = get_known_job_ids()
        print(f"Found {len(known_ids)} conversions in database.\n")
    except Exception as e:
        print(f"ERROR: could not read conversions table: {e}")
        sys.exit(1)

    total_orphans = 0
    total_size = 0

    for folder in [INPUT_DIR, OUTPUT_DIR]:
        orphans, kept = scan_folder(folder, known_ids, args.older_than)
        print(f"== {folder.relative_to(UPLOAD_ROOT.parent)} ==")
        print(f"  orphaned: {len(orphans)} file(s), kept: {len(kept)} file(s)")
        for path, size in orphans:
            print(f"    - {path.name}  ({human(size)})")
            total_orphans += 1
            total_size += size

    print(f"\nTotal orphans: {total_orphans} file(s), {human(total_size)}")

    if not args.delete:
        print("\nDry-run only. Re-run with --delete to actually remove files.")
        return

    if total_orphans == 0:
        print("\nNothing to delete.")
        return

    confirm = input(f"\nDelete {total_orphans} file(s) ({human(total_size)})? [y/N] ")
    if confirm.strip().lower() != "y":
        print("Aborted.")
        return

    deleted = 0
    for folder in [INPUT_DIR, OUTPUT_DIR]:
        orphans, _ = scan_folder(folder, known_ids, args.older_than)
        for path, _ in orphans:
            try:
                path.unlink()
                deleted += 1
            except Exception as e:
                print(f"  failed to delete {path.name}: {e}")
    print(f"Deleted {deleted} file(s).")


if __name__ == "__main__":
    main()
