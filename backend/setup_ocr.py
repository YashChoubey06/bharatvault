"""Download OCR runtime/models, never documents. Windows portable, no administrator install."""
import subprocess
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent / 'tools'
root.mkdir(exist_ok=True)
installer = root / 'tesseract-setup.exe'
if not installer.exists():
    urllib.request.urlretrieve('https://github.com/tesseract-ocr/tesseract/releases/download/5.5.3/tesseract-ocr-w64-setup-5.5.3.20260724.exe', installer)
target = root / 'tesseract'
subprocess.run([r'C:\Program Files\7-Zip\7z.exe', 'x', str(installer), '-o' + str(target), '-y'], check=True, stdout=subprocess.DEVNULL)
for language in ('eng', 'hin'):
    model = target / 'tessdata' / (language + '.traineddata')
    model.parent.mkdir(exist_ok=True)
    if not model.exists():
        urllib.request.urlretrieve('https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/' + model.name, model)
subprocess.run([str(target / 'tesseract.exe'), '--list-langs'], check=True)
