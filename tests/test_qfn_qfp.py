from pcbai.steps.footprint_qfn_qfp import QfnParams, QfpParams, generate_qfn, generate_qfp


def test_qfn_pad_count():
    p = QfnParams(name="QFN-32", pins=32, pitch=0.5, body_l=5.0, body_w=5.0, pad_l=0.6, pad_w=0.25, ep_l=3.2, ep_w=3.2)
    text = generate_qfn(p)
    assert text.count("(pad ") >= 32  # plus EP


def test_qfp_pad_count():
    p = QfpParams(name="LQFP-64", pins=64, pitch=0.5, body_l=10.0, body_w=10.0, pad_l=1.2, pad_w=0.3)
    text = generate_qfp(p)
    assert text.count("(pad ") == 64
