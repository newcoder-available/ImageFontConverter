import os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "samples")
FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")

def create_gaming_ui_sample() -> str:
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    out_path = os.path.join(SAMPLE_DIR, "gaming_ui.png")
    
    w, h = 900, 600
    img = np.zeros((h, w, 3), dtype=np.uint8)

    # Vibrant dark purple / indigo gradient background
    for y in range(h):
        ratio = y / h
        r = int(18 + 25 * ratio)
        g = int(14 + 10 * ratio)
        b = int(45 + 40 * ratio)
        img[y, :] = (b, g, r)

    # Add geometric tech grid and glow
    cv2.circle(img, (450, 180), 220, (65, 30, 90), -1)
    cv2.circle(img, (450, 180), 160, (90, 40, 120), -1)

    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    font_bold = os.path.join(FONT_DIR, "NotoSans-Bold.ttf")
    font_reg = os.path.join(FONT_DIR, "NotoSans-Regular.ttf")

    try:
        title_font = ImageFont.truetype(font_bold, 54)
        btn_font = ImageFont.truetype(font_bold, 30)
    except Exception:
        title_font = btn_font = ImageFont.load_default()

    draw.text((450, 130), "WINNER", font=title_font, fill=(255, 215, 0), anchor="mm")

    # Glowing button 1: START GAME
    btn1_bbox = [250, 290, 650, 380]
    draw.rounded_rectangle(btn1_bbox, radius=20, fill=(235, 35, 95), outline=(255, 110, 160), width=3)
    draw.text((450, 335), "START GAME", font=btn_font, fill=(255, 255, 255), anchor="mm")

    # Button 2: SELECT BET
    btn2_bbox = [280, 420, 620, 500]
    draw.rounded_rectangle(btn2_bbox, radius=18, fill=(35, 130, 240), outline=(90, 180, 255), width=2)
    draw.text((450, 460), "SELECT BET", font=btn_font, fill=(255, 255, 255), anchor="mm")

    res_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    cv2.imwrite(out_path, res_bgr)
    return out_path

def create_cartoon_3d_sample() -> str:
    """
    Creates a 3D stylized cartoon gaming title: 'HIGHS AND LOWS'
    with bright yellow face, dark maroon 3D extrusion, and dark outline stroke.
    """
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    out_path = os.path.join(SAMPLE_DIR, "highs_and_lows.png")
    
    w, h = 600, 500
    # Clean warm off-white / light cream background
    img = np.full((h, w, 3), (248, 250, 252), dtype=np.uint8)

    # Add subtle yellow sunburst glow in center
    cv2.circle(img, (300, 250), 180, (220, 245, 255), -1)

    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    display_font_path = os.path.join(FONT_DIR, "titanone-regular.ttf")
    if not os.path.exists(display_font_path):
        display_font_path = os.path.join(FONT_DIR, "ariblk.ttf")

    try:
        font_big = ImageFont.truetype(display_font_path, 80)
        font_mid = ImageFont.truetype(display_font_path, 52)
    except Exception:
        font_big = font_mid = ImageFont.load_default()

    lines = [
        ("HIGHS", font_big, 120),
        ("AND", font_mid, 230),
        ("LOWS", font_big, 350)
    ]

    # Colors: Yellow Face (#FFDE17), Maroon 3D Shadow (#7A0B3C), Dark Outline (#200515)
    face_color = (255, 222, 23)
    shadow_color = (122, 11, 60)
    stroke_color = (32, 5, 21)

    for text, font, cy in lines:
        cx = 300
        # 1. 3D extrusion depth layers
        for d in range(12, 0, -1):
            draw.text((cx, cy + d), text, font=font, fill=shadow_color, anchor="mm", stroke_width=4, stroke_fill=stroke_color)
        # 2. Outer stroke outline
        draw.text((cx, cy), text, font=font, fill=stroke_color, anchor="mm", stroke_width=6, stroke_fill=stroke_color)
        # 3. Bright yellow face
        draw.text((cx, cy), text, font=font, fill=face_color, anchor="mm")

    res_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    cv2.imwrite(out_path, res_bgr)
    return out_path

def create_sale_banner_sample() -> str:
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    out_path = os.path.join(SAMPLE_DIR, "sale_banner.png")
    
    w, h = 850, 500
    img = np.zeros((h, w, 3), dtype=np.uint8)

    for y in range(h):
        ratio = y / h
        r = int(10 + 15 * ratio)
        g = int(35 + 40 * ratio)
        b = int(30 + 30 * ratio)
        img[y, :] = (b, g, r)

    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    font_bold = os.path.join(FONT_DIR, "NotoSans-Bold.ttf")
    font_reg = os.path.join(FONT_DIR, "NotoSans-Regular.ttf")

    try:
        f_top = ImageFont.truetype(font_reg, 26)
        f_hero = ImageFont.truetype(font_bold, 58)
        f_sub = ImageFont.truetype(font_bold, 36)
        f_btn = ImageFont.truetype(font_bold, 28)
    except Exception:
        f_top = f_hero = f_sub = f_btn = ImageFont.load_default()

    draw.text((425, 90), "SPECIAL OFFER", font=f_top, fill=(52, 211, 153), anchor="mm")
    draw.text((425, 170), "SUMMER MEGA SALE", font=f_hero, fill=(255, 255, 255), anchor="mm")
    draw.text((425, 245), "GET 50% DISCOUNT TODAY", font=f_sub, fill=(251, 191, 36), anchor="mm")

    draw.rounded_rectangle([300, 330, 550, 410], radius=15, fill=(16, 185, 129), outline=(110, 231, 183), width=2)
    draw.text((425, 370), "SHOP NOW", font=f_btn, fill=(255, 255, 255), anchor="mm")

    res_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    cv2.imwrite(out_path, res_bgr)
    return out_path

def generate_all_samples():
    g = create_gaming_ui_sample()
    hl = create_cartoon_3d_sample()
    s = create_sale_banner_sample()
    return {"gaming_ui": g, "highs_and_lows": hl, "sale_banner": s}

if __name__ == "__main__":
    generate_all_samples()
    print("Samples generated successfully in backend/samples/")
