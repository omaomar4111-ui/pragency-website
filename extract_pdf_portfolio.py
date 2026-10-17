#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PR Agency — Bulk PDF Portfolio Extractor & Uploader
Extracts design slides from portfolio PDF, filters out global watermarks,
saves clean high-res images, and uploads directly to PR Agency D1 / R2.
"""

import os
import sys
import io
import argparse
import base64
import urllib.request
import json
import pypdf
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "https://pragency.pages.dev"
ADMIN_AUTH = "Basic " + base64.b64encode(b"admin:pr2026").decode('ascii')

def parse_args():
    parser = argparse.ArgumentParser(description="Extract clean portfolio designs from PDF and upload to Brand profile")
    parser.add_argument("--pdf", required=True, help="Path to PDF file (e.g. E:\\Assets\\...\\PR_Portfolio_v1_backup.pdf)")
    parser.add_argument("--brand", required=True, help="Brand slug in D1 (e.g. ovo, island-gym, bliltna)")
    parser.add_argument("--pages", help="Specific pages (e.g. 14-17 or 14,15,16,17). Defaults to all pages.")
    parser.add_argument("--crop-mode", choices=["clean_canvas", "raw_images"], default="clean_canvas",
                        help="clean_canvas: crops central design area eliminating header/footer watermarks")
    parser.add_argument("--out-dir", default="extracted_portfolio_designs", help="Directory to save extracted images locally")
    parser.add_argument("--dry-run", action="store_true", help="Extract and save locally without uploading to server")
    return parser.parse_args()

def get_brand_info(brand_slug):
    url = f"{API_BASE}/api/admin/portfolio/brands"
    req = urllib.request.Request(url, headers={"Authorization": ADMIN_AUTH})
    with urllib.request.urlopen(req) as resp:
        brands = json.loads(resp.read().decode('utf-8'))
        for b in brands:
            if b['slug'].lower() == brand_slug.lower():
                return b
    return None

def upload_design_to_api(brand_id, image_data_bytes, filename, page_num):
    # 1. Base64 encode for direct upload
    b64_str = base64.b64encode(image_data_bytes).decode('ascii')
    mime_type = "image/jpeg" if filename.lower().endswith(('.jpg', '.jpeg')) else "image/png"
    data_uri = f"data:{mime_type};base64,{b64_str}"

    payload = {
        "brand_id": brand_id,
        "title_ar": f"تصميم صفحة {page_num}",
        "title_en": f"Deliverable Page {page_num}",
        "image_url": data_uri,
        "media_type": "image",
        "design_type": "social_media",
        "display_order": page_num,
        "is_published": 1
    }

    url = f"{API_BASE}/api/admin/portfolio/designs"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": ADMIN_AUTH,
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def parse_page_range(range_str, max_pages):
    if not range_str:
        return list(range(1, max_pages + 1))
    pages = set()
    parts = range_str.split(',')
    for part in parts:
        part = part.strip()
        if '-' in part:
            start, end = part.split('-')
            for p in range(int(start), int(end) + 1):
                if 1 <= p <= max_pages:
                    pages.add(p)
        else:
            p = int(part)
            if 1 <= p <= max_pages:
                pages.add(p)
    return sorted(list(pages))

def main():
    args = parse_args()

    if not os.path.exists(args.pdf):
        print(f"❌ Error: PDF file not found at: {args.pdf}")
        sys.exit(1)

    print(f"📄 Reading PDF: {args.pdf}")
    reader = pypdf.PdfReader(args.pdf)
    total_pages = len(reader.pages)
    print(f"ℹ️  Total PDF pages: {total_pages}")

    target_pages = parse_page_range(args.pages, total_pages)
    print(f"🎯 Target pages to process ({len(target_pages)}): {target_pages}")

    brand = None
    if not args.dry_run:
        print(f"🔍 Verifying brand '{args.brand}' in D1 database...")
        brand = get_brand_info(args.brand)
        if not brand:
            print(f"❌ Error: Brand '{args.brand}' not found in D1! Please verify slug.")
            sys.exit(1)
        print(f"✅ Found Brand: {brand['name_ar']} ({brand['name_en']}) | ID: {brand['id']}")

    os.makedirs(args.out_dir, exist_ok=True)
    brand_out_dir = os.path.join(args.out_dir, args.brand)
    os.makedirs(brand_out_dir, exist_ok=True)

    extracted_count = 0
    uploaded_count = 0

    for page_num in target_pages:
        page_idx = page_num - 1
        page = reader.pages[page_idx]

        if not page.images:
            print(f"⚠️  Page {page_num:02d}: No embedded images found. Skipping.")
            continue

        raw_img_obj = page.images[0]
        full_img = Image.open(io.BytesIO(raw_img_obj.data)).convert('RGB')
        w, h = full_img.size

        # Watermark & Branding Filter (Clean Canvas Mode)
        # Standard PDF canvas is 1754 x 1240.
        # Top banner (0..100) has agency heading/page numbering
        # Bottom area (1120..1240) has VR/PR logo and year (2026) watermarks
        if args.crop_mode == "clean_canvas":
            # Crop the high-res central artwork
            # Box: (left, top, right, bottom)
            crop_box = (
                int(w * 0.02),   # 2% left margin
                int(h * 0.08),   # 8% top margin (skips top text/header)
                int(w * 0.98),   # 2% right margin
                int(h * 0.91)    # 9% bottom margin (skips watermark, year 2026, and corner logos)
            )
            clean_img = full_img.crop(crop_box)
        else:
            clean_img = full_img

        out_filename = f"{args.brand}_page_{page_num:02d}.jpg"
        out_filepath = os.path.join(brand_out_dir, out_filename)
        clean_img.save(out_filepath, "JPEG", quality=92, optimize=True)
        extracted_count += 1
        print(f"  [EXTRACTED] Page {page_num:02d} -> {out_filepath} (Size: {clean_img.size})")

        if not args.dry_run:
            buf = io.BytesIO()
            clean_img.save(buf, format="JPEG", quality=90, optimize=True)
            img_bytes = buf.getvalue()

            try:
                res = upload_design_to_api(brand['id'], img_bytes, out_filename, page_num)
                if res.get('success'):
                    uploaded_count += 1
                    print(f"    ↳ [UPLOADED TO D1] Design ID: {res.get('id')}")
                else:
                    print(f"    ↳ [UPLOAD FAILED]: {res}")
            except Exception as e:
                print(f"    ↳ [UPLOAD ERROR]: {e}")

    print("\n=======================================================")
    print(f"🎉 Extraction Completed for Brand: {args.brand}")
    print(f"📁 Local files saved in: {brand_out_dir}")
    print(f"📊 Extracted: {extracted_count} slides | Uploaded to D1: {uploaded_count}")
    print("=======================================================")

if __name__ == "__main__":
    main()
