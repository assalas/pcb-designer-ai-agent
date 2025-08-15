from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors

def create_test_pdf(path="tests/test_datasheet.pdf"):
    doc = SimpleDocTemplate(path, pagesize=letter)
    elements = []

    data = [
        ['Symbol', 'mm', 'inch'],
        ['L', '1.6', '0.063'],
        ['W', '0.8', '0.031'],
        ['T', '0.45', '0.018'],
        ['Top Term', '0.3', '0.012'],
    ]

    table = Table(data)
    style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ])
    table.setStyle(style)

    elements.append(table)
    doc.build(elements)

if __name__ == "__main__":
    create_test_pdf()
