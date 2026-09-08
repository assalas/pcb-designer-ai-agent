import json
from unittest import mock
from pcbai.steps.datasheet_package_extractor import extract_package_params_from_pdf_vision, PackageGuess


class MockPage:
    def get_pixmap(self, dpi):
        class MockPixmap:
            def tobytes(self, ext):
                return b"fake_png_data"
        return MockPixmap()

class MockDoc:
    def __init__(self, pages):
        self._pages = [MockPage() for _ in range(pages)]
    def __len__(self):
        return len(self._pages)
    def __getitem__(self, idx):
        return self._pages[idx]

class MockProvider:
    def __init__(self, response_text):
        self.response_text = response_text

    def complete(self, prompt, **kwargs):
        return self.response_text


def test_vision_extractor_json_parsing():
    # Simulate an LLM returning markdown JSON block
    llm_response = '''```json
{
  "pkg_type": "bga",
  "pins": 144,
  "pitch": 1.0,
  "body_l": 14.0,
  "body_w": 14.0,
  "pad_l": 0.5,
  "pad_w": 0.5
}
```'''
    provider = MockProvider(response_text=llm_response)

    # We must patch sys.modules to simulate pymupdf being imported correctly in the target module
    import sys
    with mock.patch.dict(sys.modules, {'pymupdf': mock.MagicMock()}):
        import pymupdf
        with mock.patch.object(pymupdf, 'open', return_value=MockDoc(10)):
            guess = extract_package_params_from_pdf_vision("dummy.pdf", provider=provider)

    assert guess.pkg_type == "bga"
    assert guess.pins == 144
    assert guess.pitch == 1.0
    assert guess.pad_l == 0.5


def test_vision_extractor_invalid_json():
    # Simulate LLM failing to return proper JSON
    llm_response = "I couldn't find the package type."
    provider = MockProvider(response_text=llm_response)

    import sys
    with mock.patch.dict(sys.modules, {'pymupdf': mock.MagicMock()}):
        import pymupdf
        with mock.patch.object(pymupdf, 'open', return_value=MockDoc(1)):
            guess = extract_package_params_from_pdf_vision("dummy.pdf", provider=provider)

    assert guess.pkg_type == "unknown"
    assert guess.pins is None
