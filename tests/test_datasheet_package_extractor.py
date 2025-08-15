import os
from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf
from generate_test_pdf import create_test_pdf

def test_extract_package_params_from_pdf():
    pdf_path = "tests/test_datasheet.pdf"

    # Ensure the test PDF exists
    if not os.path.exists(pdf_path):
        create_test_pdf(pdf_path)

    params = extract_package_params_from_pdf(pdf_path)

    assert params['body_l'] == 1.6
    assert params['body_w'] == 0.8
    assert params['pad_w'] == 0.3

    # Clean up the generated PDF
    os.remove(pdf_path)
