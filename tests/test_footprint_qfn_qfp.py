from pcbai.steps.footprint_qfn_qfp import QfnParams, QfpParams, generate_qfn, generate_qfp

def test_generate_qfn_basic():
    params = QfnParams(name="QFN-16", pins=16, pitch=0.5, body_l=4.0, body_w=4.0, pad_l=0.4, pad_w=0.25)
    text = generate_qfn(params)
    assert "(module QFN-16" in text
    assert text.count("(pad ") == 16

def test_generate_qfp_basic():
    params = QfpParams(name="QFP-32", pins=32, pitch=0.8, body_l=7.0, body_w=7.0, pad_l=1.0, pad_w=0.4, gullwing_ext=0.2)
    text = generate_qfp(params)
    assert "(module QFP-32" in text
    assert text.count("(pad ") == 32

def test_generate_qfn_invalid_pins_error():
    params = QfnParams(name="QFN-15", pins=15, pitch=0.5, body_l=4.0, body_w=4.0, pad_l=0.4, pad_w=0.25)
    try:
        generate_qfn(params)
    except ValueError:
        return
    assert False, "Expected ValueError for non-multiple-of-4 pins"

def test_generate_qfp_invalid_pins_error():
    params = QfpParams(name="QFP-31", pins=31, pitch=0.8, body_l=7.0, body_w=7.0, pad_l=1.0, pad_w=0.4, gullwing_ext=0.2)
    try:
        generate_qfp(params)
    except ValueError:
        return
    assert False, "Expected ValueError for non-multiple-of-4 pins"
