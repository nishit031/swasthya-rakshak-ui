import os
import sys

# Make the `app` package importable when pytest is run from the ocr-service/ root.
sys.path.insert(0, os.path.dirname(__file__))
