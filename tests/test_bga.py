from pcbai.steps.footprint_bga import BgaParams, generate_bga, _get_bga_row_letters

def test_bga_row_letters():
    letters = _get_bga_row_letters(25)
    # Check that skipped letters are missing
    for skip in ["I", "O", "Q", "S", "X", "Z"]:
        assert skip not in letters

    # Check general properties
    assert letters[0] == "A"
    assert len(letters) == 25
    assert letters[-1] == "AE"


def test_bga_pad_count_and_names():
    p = BgaParams(name="BGA-144", rows=12, cols=12, pitch=1.0, body_l=14, body_w=14, pad_dia=0.5)
    text = generate_bga(p)

    # 12x12 = 144 pads
    assert text.count("(pad ") == 144

    # Should have A1
    assert "(pad A1 smd circle" in text

    # Row 9 in letters is typically K (A, B, C, D, E, F, G, H, J, K) -> wait, K is index 9?
    # 1: A, 2: B, 3: C, 4: D, 5: E, 6: F, 7: G, 8: H, 9: J, 10: K, 11: L, 12: M
    assert "(pad M12 smd circle" in text

    # Check we don't have I1
    assert "(pad I1 " not in text
