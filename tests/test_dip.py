from pcbai.steps.footprint_dip import DipParams, generate_dip

def test_dip_pad_count_and_names():
    p = DipParams(name="DIP-8", pins=8, pitch=2.54, row_spacing=7.62, body_l=10.0, body_w=6.35, pad_dia=1.6, drill_dia=0.8)
    text = generate_dip(p)

    # 8 pads
    assert text.count("thru_hole") == 8

    # Should have pad 1 as rect
    assert "(pad 1 thru_hole rect" in text

    # Should have pad 8 as circle
    assert "(pad 8 thru_hole circle" in text
