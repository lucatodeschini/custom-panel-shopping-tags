import io
import yaml
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

# Constants
QR_SIZE = 80 * mm
PADDING = 20 * mm
TEXT_HEIGHT = 10 * mm
ITEMS_PER_ROW = 2

def load_yaml(yaml_path):
    with open(yaml_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def generate_qr_code(tag_name):
    url = f"homeassistant://navigate/shopping-tags?category={tag_name}"
    qr = qrcode.make(url)
    return qr

def draw_qr(canvas, qr_img, x, y, label):
    # Save the QR image to a buffer
    buffer = io.BytesIO()
    qr_img.save(buffer, format="PNG")
    buffer.seek(0)

    # Wrap the buffer in an ImageReader
    img_reader = ImageReader(buffer)

    # Draw the QR image
    canvas.drawImage(img_reader, x, y, QR_SIZE, QR_SIZE)

    # Draw the label below the QR code
    canvas.setFont("Helvetica", 10)
    canvas.drawCentredString(x + QR_SIZE / 2, y - 5, label)

def create_pdf(data, output_path="shopping_tags.pdf"):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    x = PADDING
    y = height - PADDING - QR_SIZE

    for tag in data['tags']:
        tag_name = tag['name']
        qr_img = generate_qr_code(tag_name)
        label = f"Shopping Tag {tag_name}"
        draw_qr(c, qr_img, x, y, label)

        # Next column or next row
        x += QR_SIZE + PADDING
        if x + QR_SIZE > width:
            x = PADDING
            y -= QR_SIZE + TEXT_HEIGHT + PADDING
            if y < PADDING:
                c.showPage()
                y = height - PADDING - QR_SIZE

    c.save()

if __name__ == "__main__":
    data = load_yaml("tags.yaml")  # Replace with your actual YAML file path
    create_pdf(data)
    print("PDF created: shopping_tags.pdf")
