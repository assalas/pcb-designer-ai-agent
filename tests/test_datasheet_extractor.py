from unittest import mock
from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf, PackageGuess

def test_extract_soic():
    mock_text = "The device is available in a 14-pin SOIC package. Pitch: 1.27mm. Body length: 8.65 mm. Body width: 3.9 mm."
    with mock.patch('pcbai.steps.datasheet_package_extractor.extract_text', return_value=mock_text):
        guess = extract_package_params_from_pdf("dummy.pdf")
        assert guess.pkg_type == "soic"
        assert guess.pins == 14
        assert guess.pitch == 1.27
        assert guess.body_l == 8.65
        assert guess.body_w == 3.9

def test_extract_bga():
    mock_text = "This is a 64-pin TFBGA. Lead pitch 1.0mm. Ball diameter is 0.5mm. Package length: 10mm. Package width: 10 mm."
    with mock.patch('pcbai.steps.datasheet_package_extractor.extract_text', return_value=mock_text):
        guess = extract_package_params_from_pdf("dummy.pdf")
        assert guess.pkg_type == "bga"
        assert guess.pins == 64
        assert guess.pitch == 1.0
        assert guess.pad_l == 0.5
        assert guess.pad_w == 0.5
        assert guess.body_l == 10.0
        assert guess.body_w == 10.0

def test_extract_dip():
    mock_text = "Standard 8-pin PDIP package. Pitch: 2.54 mm."
    with mock.patch('pcbai.steps.datasheet_package_extractor.extract_text', return_value=mock_text):
        guess = extract_package_params_from_pdf("dummy.pdf")
        assert guess.pkg_type == "dip"
        assert guess.pins == 8
        assert guess.pitch == 2.54

def test_extract_qfn_unknown():
    # existing functionality check
    mock_text = "32-pin QFN package, pitch: 0.5 mm"
    with mock.patch('pcbai.steps.datasheet_package_extractor.extract_text', return_value=mock_text):
        guess = extract_package_params_from_pdf("dummy.pdf")
        assert guess.pkg_type == "qfn"
        assert guess.pins == 32
        assert guess.pitch == 0.5
