🎭 Real-Time Image Processing & Face Filters
This project explores real-time image processing and face detection using thresholding across multiple color spaces (RGB, YCbCr, CMYK). I began by capturing video frames and splitting them into individual channels to isolate features like red objects or green backgrounds. Extending to YCbCr and CMYK enabled more precise skin detection and background separation.

To handle variable lighting, I implemented dynamic sliders for real-time threshold adjustments and applied local histogram equalization for brightness normalization.

A key feature is real-time face detection using the Viola-Jones algorithm, overlaid with themed masks (Joker and Batman). I calculated bounding boxes to scale and position the masks, adjusting iteratively for better alignment.

An interactive element allows switching between masks via keyboard input, blending technical image processing with creative storytelling inspired by the DC Universe.
