"""Generate visibly synthetic scans locally; these are test fixtures, not land records."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from . import store as db


def generate(target=None):
    target=Path(target or db.DATA/'samples')
    target.mkdir(parents=True,exist_ok=True)
    font_path=Path('C:/Windows/Fonts/Nirmala.ttc')
    if not font_path.exists(): font_path=Path('C:/Windows/Fonts/arial.ttf')
    font=ImageFont.truetype(str(font_path),36)
    fixtures={
        'sample-ror-english.png': ['SYNTHETIC TEST RECORD - NOT A LEGAL DOCUMENT','Record of Rights / Jamabandi','Owner: Suresh Kumar','Survey Number: 124/3','Khata Number: KH-782','Area: 2.50 hectares','Village: Rampura','Tehsil: Ladpura','District: Kota','Land Classification: Agricultural'],
        'sample-sale-conflict.png': ['SYNTHETIC TEST RECORD - NOT A LEGAL DOCUMENT','Registration Deed','Buyer: Suresh Kumar','Seller: Ramesh Kumar','Survey Number: 124/3','Area: 2.20 hectares','Registration Number: REG-2021-458','Registration Date: 2021-08-17'],
        'sample-ror-hindi.png': ['SYNTHETIC TEST RECORD - NOT A LEGAL DOCUMENT','जमाबंदी','खातेदार: कविता देवी','खसरा: 126/2','खाता: KH-784','क्षेत्रफल: 0.82 हेक्टेयर','ग्राम: रामपुरा','तहसील: लाडपुरा','जिला: कोटा'],
    }
    for name,lines in fixtures.items():
        img=Image.new('RGB',(1800,1600),'white')
        draw=ImageDraw.Draw(img)
        for index,line in enumerate(lines): draw.text((90,100+index*110),line,font=font,fill='black')
        img.save(target/name)
    return target


if __name__=='__main__':
    print(generate())
