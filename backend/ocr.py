"""Local Tesseract OCR with source-pixel coordinates. No network calls."""
import csv
import io
import os
import shutil
import subprocess
from pathlib import Path

import pymupdf
from PIL import Image, ImageOps
from . import store as db

Image.MAX_IMAGE_PIXELS = 25_000_000
MAX_PAGES = 20


def executable():
    value = os.getenv('TESSERACT_CMD') or shutil.which('tesseract')
    return value or str(db.ROOT / 'tools' / 'tesseract' / 'tesseract.exe')


def health():
    try:
        result = subprocess.run([executable(), '--list-langs'], capture_output=True, text=True, timeout=10)
        languages = result.stdout.splitlines()[1:]
        return dict(available=result.returncode == 0, languages=languages, engine='Tesseract')
    except (OSError, subprocess.TimeoutExpired):
        return dict(available=False, languages=[], engine='Tesseract')


def validate(content):
    if content.startswith(b'%PDF-'):
        with pymupdf.open(stream=content, filetype='pdf') as pdf:
            if pdf.needs_pass or not 1 <= len(pdf) <= MAX_PAGES:
                raise ValueError('PDF must be unencrypted and contain 1–20 pages.')
            for page in pdf:
                if page.rect.width * page.rect.height * (200 / 72) ** 2 > Image.MAX_IMAGE_PIXELS:
                    raise ValueError('PDF page dimensions exceed the processing limit.')
            return 'pdf', len(pdf)
    with Image.open(io.BytesIO(content)) as image:
        if image.format not in ('PNG', 'JPEG', 'TIFF'):
            raise ValueError('Use PDF, PNG, JPEG, or TIFF.')
        count = getattr(image, 'n_frames', 1)
        if not 1 <= count <= MAX_PAGES:
            raise ValueError('Maximum 20 pages per document.')
        for index in range(count):
            image.seek(index)
            if image.width * image.height > Image.MAX_IMAGE_PIXELS:
                raise ValueError('Maximum 25 megapixels per page.')
            image.load()
        return image.format.lower(), count


def recognize(path, language, page):
    command = [executable(), str(path), 'stdout', '-l', language, '--psm', '6', 'tsv']
    result = subprocess.run(command, capture_output=True, encoding='utf-8', errors='replace', timeout=90)
    if result.returncode:
        raise RuntimeError('Tesseract failed. Check the configured executable and English/Hindi language models.')
    groups = {}
    for word in csv.DictReader(io.StringIO(result.stdout), delimiter='\t', quoting=csv.QUOTE_NONE):
        if word.get('level') != '5' or not word.get('text', '').strip():
            continue
        key = (word['block_num'], word['par_num'], word['line_num'])
        groups.setdefault(key, []).append(word)
    with Image.open(path) as image:
        width, height = image.size
    lines = []
    for words in groups.values():
        left = min(int(w['left']) for w in words)
        top = min(int(w['top']) for w in words)
        right = max(int(w['left']) + int(w['width']) for w in words)
        bottom = max(int(w['top']) + int(w['height']) for w in words)
        lines.append(dict(text=' '.join(w['text'] for w in words), confidence=sum(max(0, float(w['conf'])) for w in words) / len(words) / 100,
            bbox=[left, top, right, bottom], page=page, pageWidth=width, pageHeight=height,
            method='mean Tesseract word confidence (not calibrated accuracy)', modelVersion='tesseract-5-label-rules-v1'))
    return lines


def process(doc, progress):
    folder = db.DATA / 'documents' / doc['id']
    original = folder / ('original.' + doc['format'])
    lines = []
    pdf = pymupdf.open(original) if doc['format'] == 'pdf' else None
    image = None if pdf else Image.open(original)
    try:
        for index in range(doc['pages']):
            path = folder / f'page-{index + 1}.png'
            if pdf:
                pixmap = pdf[index].get_pixmap(dpi=200, alpha=False)
                raster = Image.frombytes('RGB', [pixmap.width, pixmap.height], pixmap.samples)
            else:
                image.seek(index)
                raster = ImageOps.exif_transpose(image).convert('RGB')
            # OCR and displayed image share exactly the same coordinate frame.
            ImageOps.autocontrast(raster.convert('L')).save(path)
            lines.extend(recognize(path, doc['language'], index + 1))
            progress(index + 1)
    finally:
        if pdf:
            pdf.close()
        if image:
            image.close()
    return lines
