from pcbai.steps.footprint_generator import SmdRcParams, SoicParams, generate_smd_rc, generate_soic


def test_generate_smd_rc_basic():
    params = SmdRcParams(name="R_0603", body_l=1.6, body_w=0.8, pad_l=0.9, pad_w=0.8, gap=0.8)
    text = generate_smd_rc(params)
    assert "(module R_0603" in text
    assert "(pad 1 smd rect" in text and "(pad 2 smd rect" in text


def test_generate_soic_even_pins():
    params = SoicParams(name="SOIC-14", pins=14, pitch=1.27, body_l=8.7, body_w=3.9, pad_l=1.5, pad_w=0.6, row_offset=2.3)
    text = generate_soic(params)
    assert text.count("(pad ") == 14


def test_generate_soic_odd_pins_error():
    params = SoicParams(name="SOIC-13", pins=13, pitch=1.27, body_l=8.7, body_w=3.9, pad_l=1.5, pad_w=0.6, row_offset=2.3)
    try:
        generate_soic(params)
    except ValueError:
        return
    assert False, "Expected ValueError for odd pins"
